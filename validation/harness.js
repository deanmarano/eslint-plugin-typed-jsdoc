#!/usr/bin/env node
/**
 * Validation Harness for eslint-plugin-typed-jsdoc
 *
 * Tests the plugin against popular npm packages.
 *
 * Usage:
 *   node validation/harness.js                    # Test all packages
 *   node validation/harness.js lodash express    # Test specific packages
 *   node validation/harness.js --download-only   # Just download, don't lint
 *   node validation/harness.js --report          # Generate comparison report
 *   node validation/harness.js --concurrency=8   # Run with 8 parallel workers
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VALIDATION_DIR = __dirname;
const PACKAGES_DIR = path.join(VALIDATION_DIR, 'packages');
const REPORTS_DIR = path.join(VALIDATION_DIR, 'reports');
const PLUGIN_ROOT = path.dirname(VALIDATION_DIR);

const DEFAULT_CONCURRENCY = 4;

/**
 * @typedef {object} PackageConfig
 * @property {string} name
 * @property {string} repo
 * @property {string} branch
 * @property {string} src
 * @property {string | null} types
 * @property {string} [note]
 * @property {string[]} include
 * @property {string[]} exclude
 */

/**
 * @typedef {object} LintResult
 * @property {string} file
 * @property {number} line
 * @property {number} column
 * @property {string} rule
 * @property {'error' | 'warning'} severity
 * @property {string} message
 */

/**
 * @typedef {object} PackageReport
 * @property {string} name
 * @property {string} downloadedAt
 * @property {string} lintedAt
 * @property {number} filesAnalyzed
 * @property {number} totalIssues
 * @property {number} errors
 * @property {number} warnings
 * @property {Record<string, number>} byRule
 * @property {LintResult[]} issues
 * @property {string | null} typesPackage
 * @property {number} [duration]
 */

/** Simple semaphore for concurrency control */
class Semaphore {
  constructor(permits) {
    this.permits = permits;
    /** @type {(() => void)[]} */
    this.waiting = [];
  }

  async acquire() {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release() {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift();
      next();
    } else {
      this.permits++;
    }
  }
}

/** @returns {PackageConfig[]} */
function loadPackageConfigs() {
  const configPath = path.join(VALIDATION_DIR, 'packages.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return config.packages;
}

/**
 * @param {PackageConfig} pkg
 */
async function downloadPackage(pkg) {
  const pkgDir = path.join(PACKAGES_DIR, pkg.name);

  if (fs.existsSync(pkgDir)) {
    try {
      execSync(`git -C "${pkgDir}" fetch origin && git -C "${pkgDir}" reset --hard origin/${pkg.branch}`, {
        stdio: 'pipe',
      });
    } catch (e) {
      fs.rmSync(pkgDir, { recursive: true, force: true });
    }
  }

  if (!fs.existsSync(pkgDir)) {
    execSync(`git clone --depth 1 --branch ${pkg.branch} https://github.com/${pkg.repo}.git "${pkgDir}"`, {
      stdio: 'pipe',
    });
  }

  // Create tsconfig for the package
  const tsconfigPath = path.join(pkgDir, 'tsconfig.tjd.json');
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      lib: ['ES2022'],
      allowJs: true,
      checkJs: true,
      noEmit: true,
      strict: false,
      skipLibCheck: true,
      esModuleInterop: true,
    },
    include: pkg.include.map((p) => path.join(pkg.src, p)),
    exclude: [
      'node_modules',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/.*rc.js',
      '**/.*rc.mjs',
      '**/.eslintrc*',
      '**/.prettierrc*',
      '**/commitlint*',
      ...pkg.exclude,
    ],
  };
  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));

  // Create ESLint config for the package
  const eslintConfigPath = path.join(pkgDir, 'eslint.config.tjd.mjs');
  const pluginPath = path.relative(pkgDir, path.join(PLUGIN_ROOT, 'src/index.js')).replace(/\\/g, '/');
  const eslintConfig = `
import tsparser from '@typescript-eslint/parser';
import tjd from '${pluginPath}';

export default [
  {
    files: ${JSON.stringify(pkg.include.map((p) => path.join(pkg.src, p)))},
    ignores: ${JSON.stringify([
      'node_modules/**',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/.*rc.js',
      '**/.*rc.mjs',
      '**/.eslintrc*',
      '**/.prettierrc*',
      '**/commitlint*',
      ...pkg.exclude,
    ])},
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.tjd.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      tjd,
    },
    rules: {
      'tjd/accurate-jsdoc': 'error',
      'tjd/no-redundant-jsdoc': 'warn',
    },
  },
];
`;
  fs.writeFileSync(eslintConfigPath, eslintConfig);
}

/**
 * @param {PackageConfig} pkg
 * @returns {Promise<LintResult[]>}
 */
async function lintPackage(pkg) {
  const pkgDir = path.join(PACKAGES_DIR, pkg.name);
  /** @type {LintResult[]} */
  const results = [];

  try {
    const output = execSync(
      `npx eslint --config eslint.config.tjd.mjs --format json ${pkg.src}`,
      {
        cwd: pkgDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        maxBuffer: 50 * 1024 * 1024,
      }
    ).toString();

    const eslintResults = JSON.parse(output);
    for (const file of eslintResults) {
      for (const msg of file.messages) {
        results.push({
          file: path.relative(pkgDir, file.filePath),
          line: msg.line,
          column: msg.column,
          rule: msg.ruleId || 'unknown',
          severity: msg.severity === 2 ? 'error' : 'warning',
          message: msg.message,
        });
      }
    }
  } catch (e) {
    if (e.stdout) {
      try {
        const eslintResults = JSON.parse(e.stdout.toString());
        for (const file of eslintResults) {
          for (const msg of file.messages || []) {
            results.push({
              file: path.relative(pkgDir, file.filePath),
              line: msg.line || 0,
              column: msg.column || 0,
              rule: msg.ruleId || 'unknown',
              severity: msg.severity === 2 ? 'error' : 'warning',
              message: msg.message,
            });
          }
        }
      } catch {
        // Silently handle parse errors
      }
    }
  }

  return results;
}

/**
 * @param {string | null} typesPackage
 */
async function getTypesInfo(typesPackage) {
  if (!typesPackage) return undefined;

  try {
    const output = execSync(`npm view ${typesPackage} version 2>/dev/null`, { stdio: 'pipe' });
    return {
      definitelyTypedVersion: output.toString().trim(),
      exportCount: 0,
      jsdocCoverage: 0,
    };
  } catch {
    return undefined;
  }
}

/**
 * @param {PackageConfig} pkg
 * @param {LintResult[]} issues
 * @param {number} duration
 * @returns {Promise<PackageReport>}
 */
async function generateReport(pkg, issues, duration) {
  /** @type {Record<string, number>} */
  const byRule = {};
  let errors = 0;
  let warnings = 0;

  for (const issue of issues) {
    byRule[issue.rule] = (byRule[issue.rule] || 0) + 1;
    if (issue.severity === 'error') errors++;
    else warnings++;
  }

  const pkgDir = path.join(PACKAGES_DIR, pkg.name);
  let filesAnalyzed = 0;
  try {
    const srcDir = path.join(pkgDir, pkg.src);
    if (fs.existsSync(srcDir)) {
      const countFiles = (dir) => {
        let count = 0;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (entry.isDirectory() && entry.name !== 'node_modules') {
            count += countFiles(path.join(dir, entry.name));
          } else if (entry.isFile() && entry.name.endsWith('.js')) {
            count++;
          }
        }
        return count;
      };
      filesAnalyzed = countFiles(srcDir);
    }
  } catch {}

  const typesComparison = await getTypesInfo(pkg.types);

  return {
    name: pkg.name,
    downloadedAt: new Date().toISOString(),
    lintedAt: new Date().toISOString(),
    filesAnalyzed,
    totalIssues: issues.length,
    errors,
    warnings,
    byRule,
    issues,
    typesPackage: pkg.types,
    typesComparison,
    duration,
  };
}

/**
 * @param {PackageReport} report
 */
function saveReport(report) {
  const reportPath = path.join(REPORTS_DIR, `${report.name}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

/**
 * @param {PackageConfig} pkg
 * @param {Semaphore} semaphore
 * @param {boolean} downloadOnly
 */
async function processPackage(pkg, semaphore, downloadOnly) {
  await semaphore.acquire();
  const startTime = Date.now();

  try {
    await downloadPackage(pkg);

    if (downloadOnly) {
      return { pkg };
    }

    const issues = await lintPackage(pkg);
    const duration = Date.now() - startTime;
    const report = await generateReport(pkg, issues, duration);
    saveReport(report);

    return { pkg, report };
  } catch (e) {
    return { pkg, error: e.message?.slice(0, 200) || 'Unknown error' };
  } finally {
    semaphore.release();
  }
}

class ProgressDisplay {
  constructor(total, downloadOnly = false) {
    this.total = total;
    this.completed = 0;
    this.failed = 0;
    this.succeeded = 0;
    /** @type {Map<string, number>} */
    this.inProgress = new Map();
    this.startTime = Date.now();
    this.isDownloadOnly = downloadOnly;
  }

  start(name) {
    this.inProgress.set(name, Date.now());
  }

  complete(name, success, error) {
    const duration = this.inProgress.has(name)
      ? ((Date.now() - this.inProgress.get(name)) / 1000).toFixed(1)
      : '?';
    this.inProgress.delete(name);
    this.completed++;

    const icon = success ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
    const nameStr = name.padEnd(25);
    const durationStr = `${duration}s`.padStart(6);
    const progressStr = `[${this.completed}/${this.total}]`.padStart(10);

    if (success) {
      this.succeeded++;
      console.log(`${progressStr}  ${icon} ${nameStr} ${durationStr}`);
    } else {
      this.failed++;
      const errorMsg = error ? `  \x1b[31m${error.slice(0, 40)}\x1b[0m` : '';
      console.log(`${progressStr}  ${icon} ${nameStr} ${durationStr}${errorMsg}`);
    }
  }

  finish() {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const avgTime = this.completed > 0 ? (parseFloat(elapsed) / this.completed).toFixed(2) : '0';

    console.log('');
    console.log('─'.repeat(60));

    const action = this.isDownloadOnly ? 'Downloaded' : 'Processed';
    console.log(`  ${action} ${this.completed}/${this.total} packages in ${elapsed}s`);

    if (this.succeeded > 0) {
      console.log(`  \x1b[32m✓ ${this.succeeded} succeeded\x1b[0m`);
    }
    if (this.failed > 0) {
      console.log(`  \x1b[31m✗ ${this.failed} failed\x1b[0m`);
    }
    console.log(`  Average: ${avgTime}s per package`);
    console.log('─'.repeat(60));
  }
}

/**
 * @param {PackageReport[]} reports
 */
function generateSummary(reports) {
  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));

  console.log('\nPackage                Files    Errors   Warnings  Total    Time');
  console.log('-'.repeat(80));

  let totalFiles = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalTime = 0;

  const sorted = [...reports].sort((a, b) => b.totalIssues - a.totalIssues);

  for (const r of sorted) {
    const time = r.duration ? `${(r.duration / 1000).toFixed(1)}s` : 'N/A';
    console.log(
      `${r.name.padEnd(22)} ${String(r.filesAnalyzed).padStart(5)}    ${String(r.errors).padStart(6)}   ${String(r.warnings).padStart(8)}  ${String(r.totalIssues).padStart(5)}    ${time.padStart(6)}`
    );
    totalFiles += r.filesAnalyzed;
    totalErrors += r.errors;
    totalWarnings += r.warnings;
    totalTime += r.duration || 0;
  }

  console.log('-'.repeat(80));
  console.log(
    `${'TOTAL'.padEnd(22)} ${String(totalFiles).padStart(5)}    ${String(totalErrors).padStart(6)}   ${String(totalWarnings).padStart(8)}  ${String(totalErrors + totalWarnings).padStart(5)}    ${(totalTime / 1000).toFixed(1)}s`
  );

  console.log('\nIssues by Rule:');
  /** @type {Record<string, number>} */
  const ruleStats = {};
  for (const r of reports) {
    for (const [rule, count] of Object.entries(r.byRule)) {
      ruleStats[rule] = (ruleStats[rule] || 0) + count;
    }
  }
  for (const [rule, count] of Object.entries(ruleStats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${rule.padEnd(35)} ${count}`);
  }

  const zeroIssues = reports.filter((r) => r.totalIssues === 0);
  if (zeroIssues.length > 0) {
    console.log(`\nPackages with zero issues (${zeroIssues.length}):`);
    console.log(`  ${zeroIssues.map((r) => r.name).join(', ')}`);
  }

  // Save summary
  const summaryPath = path.join(REPORTS_DIR, '_summary.json');
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        packages: reports.map((r) => ({
          name: r.name,
          filesAnalyzed: r.filesAnalyzed,
          errors: r.errors,
          warnings: r.warnings,
          totalIssues: r.totalIssues,
          typesPackage: r.typesPackage,
          duration: r.duration,
        })),
        totals: {
          packages: reports.length,
          files: totalFiles,
          errors: totalErrors,
          warnings: totalWarnings,
          duration: totalTime,
        },
        byRule: ruleStats,
      },
      null,
      2
    )
  );
  console.log(`\nSummary saved to ${summaryPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const downloadOnly = args.includes('--download-only');
  const reportOnly = args.includes('--report');

  const concurrencyArg = args.find((a) => a.startsWith('--concurrency='));
  const concurrency = concurrencyArg
    ? parseInt(concurrencyArg.split('=')[1], 10)
    : DEFAULT_CONCURRENCY;

  const packageNames = args.filter((a) => !a.startsWith('--'));

  fs.mkdirSync(PACKAGES_DIR, { recursive: true });
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  let packages = loadPackageConfigs();
  if (packageNames.length > 0) {
    packages = packages.filter((p) => packageNames.includes(p.name));
  }

  if (packages.length === 0) {
    console.error('No packages to test');
    process.exit(1);
  }

  const action = downloadOnly ? 'Downloading' : 'Processing';
  console.log(`\n${action} ${packages.length} packages (concurrency=${concurrency})\n`);

  /** @type {PackageReport[]} */
  const reports = [];

  if (reportOnly) {
    for (const pkg of packages) {
      const reportPath = path.join(REPORTS_DIR, `${pkg.name}.json`);
      if (fs.existsSync(reportPath)) {
        reports.push(JSON.parse(fs.readFileSync(reportPath, 'utf-8')));
      }
    }
  } else {
    const semaphore = new Semaphore(concurrency);
    const progress = new ProgressDisplay(packages.length, downloadOnly);

    const promises = packages.map(async (pkg) => {
      progress.start(pkg.name);
      const result = await processPackage(pkg, semaphore, downloadOnly);
      progress.complete(pkg.name, !result.error, result.error);
      return result;
    });

    const results = await Promise.all(promises);
    progress.finish();

    for (const result of results) {
      if (result.report) {
        reports.push(result.report);
      }
    }
  }

  if (!downloadOnly && reports.length > 0) {
    generateSummary(reports);
  }
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
