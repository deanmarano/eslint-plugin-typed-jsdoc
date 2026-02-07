/**
 * Config factory functions for eslint-plugin-typed-jsdoc.
 */

import tsparser from '@typescript-eslint/parser';
import { getPresetRules } from './presets.js';
import { getFramework } from './frameworks.js';
import { getProjectType } from './project-types.js';

/**
 * @typedef {import('./types.js').CreateConfigOptions} CreateConfigOptions
 * @typedef {import('./types.js').FlatConfig} FlatConfig
 * @typedef {import('./types.js').FlatConfigArray} FlatConfigArray
 * @typedef {import('./types.js').RuleOverrides} RuleOverrides
 * @typedef {import('./types.js').RuleSeverity} RuleSeverity
 */

/**
 * Plugin reference - set by the main index.js to avoid circular imports.
 * @type {unknown}
 */
let pluginRef = null;

/**
 * Set the plugin reference (called from main index.js).
 *
 * @param {unknown} plugin
 */
export function setPluginRef(plugin) {
  pluginRef = plugin;
}

/**
 * Merge file patterns, removing duplicates.
 *
 * @param {...(string[] | undefined)} patterns
 * @returns {string[]}
 */
function mergeFiles(...patterns) {
  /** @type {Set<string>} */
  const seen = new Set();
  /** @type {string[]} */
  const result = [];
  for (const arr of patterns) {
    if (arr) {
      for (const pattern of arr) {
        if (!seen.has(pattern)) {
          seen.add(pattern);
          result.push(pattern);
        }
      }
    }
  }
  return result;
}

/**
 * Merge ignores patterns, removing duplicates.
 *
 * @param {...(string[] | undefined)} patterns
 * @returns {string[]}
 */
function mergeIgnores(...patterns) {
  return mergeFiles(...patterns);
}

/**
 * Merge rule configurations.
 * Later arguments override earlier ones.
 *
 * @param {...(RuleOverrides | undefined)} ruleConfigs
 * @returns {RuleOverrides}
 */
function mergeRules(...ruleConfigs) {
  /** @type {RuleOverrides} */
  const result = {};
  for (const config of ruleConfigs) {
    if (config) {
      for (const [key, value] of Object.entries(config)) {
        if (value !== undefined) {
          result[/** @type {keyof RuleOverrides} */ (key)] = value;
        }
      }
    }
  }
  return result;
}

/**
 * Convert RuleOverrides to ESLint rule config format with tjd prefix.
 *
 * @param {RuleOverrides} rules
 * @param {string[]} [ignorePatterns]
 * @returns {Record<string, RuleSeverity | [RuleSeverity, object]>}
 */
function toEslintRules(rules, ignorePatterns) {
  /** @type {Record<string, RuleSeverity | [RuleSeverity, object]>} */
  const result = {};
  for (const [key, severity] of Object.entries(rules)) {
    if (severity !== undefined && severity !== 'off') {
      const ruleKey = `tjd/${key}`;
      if (ignorePatterns && ignorePatterns.length > 0) {
        result[ruleKey] = [severity, { ignorePatterns }];
      } else {
        result[ruleKey] = severity;
      }
    }
  }
  return result;
}

/**
 * Build language options based on typescript config.
 *
 * @param {CreateConfigOptions} options
 * @param {boolean} jsx
 * @returns {FlatConfig['languageOptions']}
 */
function buildLanguageOptions(options, jsx) {
  /** @type {Record<string, unknown>} */
  const parserOptions = {
    ecmaFeatures: jsx ? { jsx: true } : undefined,
  };

  if (options.typescript?.project) {
    parserOptions.project = options.typescript.project;
    if (options.typescript.tsconfigRootDir) {
      parserOptions.tsconfigRootDir = options.typescript.tsconfigRootDir;
    }
  } else {
    parserOptions.projectService = true;
  }

  return {
    parser: tsparser,
    parserOptions,
  };
}

/**
 * Create ESLint config array from options.
 *
 * Basic usage: `[...tjd.createConfig()]`
 *
 * With options: `[...tjd.createConfig({ preset: 'strict', framework: 'next' })]`
 *
 * @param {CreateConfigOptions} [options={}]
 * @returns {FlatConfigArray}
 */
export function createConfig(options = {}) {
  if (!pluginRef) {
    throw new Error(
      'Plugin not initialized. Import the plugin before calling createConfig: ' +
        'import tjd from "eslint-plugin-typed-jsdoc"'
    );
  }

  const preset = options.preset ?? 'recommended';
  const projectTypeName = options.projectType ?? 'app';

  // Get base configurations
  const presetRules = getPresetRules(preset);
  const projectType = getProjectType(projectTypeName);
  const framework = options.framework ? getFramework(options.framework) : null;

  // Merge file patterns: project type + framework + user overrides
  const files = mergeFiles(
    projectType.files,
    framework?.files,
    options.files
  );

  // Merge ignore patterns: project type + framework + user overrides
  const ignores = mergeIgnores(
    projectType.ignores,
    framework?.ignores,
    options.ignores
  );

  // Merge rules: preset -> project type modifiers -> user overrides
  const mergedRules = mergeRules(
    presetRules,
    projectType.rules,
    options.rules
  );

  // Determine if JSX is needed
  const needsJsx = framework?.jsx ?? files.some((f) => f.includes('.jsx'));

  // Build language options
  const languageOptions = buildLanguageOptions(options, needsJsx);

  // Convert rules to ESLint format with tjd prefix
  const eslintRules = toEslintRules(mergedRules, options.ignorePatterns);

  // Build config array
  /** @type {FlatConfigArray} */
  const configs = [];

  // Add ignores config if we have ignores
  if (ignores.length > 0) {
    configs.push({
      name: `typed-jsdoc/${framework?.name ?? projectTypeName}/ignores`,
      ignores,
    });
  }

  // Add main rules config
  configs.push({
    name: `typed-jsdoc/${framework?.name ?? preset}/rules`,
    files,
    languageOptions,
    plugins: {
      tjd: /** @type {Record<string, unknown>} */ (pluginRef),
    },
    rules: eslintRules,
  });

  return configs;
}

/**
 * Generate a standalone config that can be copied into eslint.config.js.
 * Useful for users who want to eject from the factory function.
 *
 * @example
 * const config = tjd.ejectConfig({ preset: 'strict', framework: 'next' });
 * console.log(config); // Prints standalone config
 *
 * @param {CreateConfigOptions} [options={}]
 * @returns {string}
 */
export function ejectConfig(options = {}) {
  const preset = options.preset ?? 'recommended';
  const projectTypeName = options.projectType ?? 'app';

  // Get base configurations
  const presetRules = getPresetRules(preset);
  const projectType = getProjectType(projectTypeName);
  const framework = options.framework ? getFramework(options.framework) : null;

  // Merge patterns
  const files = mergeFiles(
    projectType.files,
    framework?.files,
    options.files
  );

  const ignores = mergeIgnores(
    projectType.ignores,
    framework?.ignores,
    options.ignores
  );

  // Merge rules
  const mergedRules = mergeRules(
    presetRules,
    projectType.rules,
    options.rules
  );

  // Determine if JSX is needed
  const needsJsx = framework?.jsx ?? files.some((f) => f.includes('.jsx'));

  // Build the ejected config string
  const configName = framework?.name ?? preset;

  let output = `import tjd from 'eslint-plugin-typed-jsdoc';
import tsparser from '@typescript-eslint/parser';

export default [
`;

  // Add ignores config if we have ignores
  if (ignores.length > 0) {
    output += `  {
    name: 'typed-jsdoc/${configName}/ignores',
    ignores: ${JSON.stringify(ignores, null, 4).replace(/\n/g, '\n    ')},
  },
`;
  }

  // Build parser options
  let parserOptions = '';
  if (options.typescript?.project) {
    parserOptions = `      project: ${JSON.stringify(options.typescript.project)},`;
    if (options.typescript.tsconfigRootDir) {
      parserOptions += `\n      tsconfigRootDir: ${JSON.stringify(options.typescript.tsconfigRootDir)},`;
    }
  } else {
    parserOptions = '      projectService: true,';
  }

  if (needsJsx) {
    parserOptions += `
      ecmaFeatures: {
        jsx: true,
      },`;
  }

  // Build rules object
  /** @type {string[]} */
  const rulesLines = [];
  for (const [key, severity] of Object.entries(mergedRules)) {
    if (severity && severity !== 'off') {
      if (options.ignorePatterns && options.ignorePatterns.length > 0) {
        rulesLines.push(
          `      'tjd/${key}': ['${severity}', { ignorePatterns: ${JSON.stringify(options.ignorePatterns)} }],`
        );
      } else {
        rulesLines.push(`      'tjd/${key}': '${severity}',`);
      }
    }
  }

  output += `  {
    name: 'typed-jsdoc/${configName}/rules',
    files: ${JSON.stringify(files, null, 4).replace(/\n/g, '\n    ')},
    languageOptions: {
      parser: tsparser,
      parserOptions: {
${parserOptions}
      },
    },
    plugins: {
      tjd,
    },
    rules: {
${rulesLines.join('\n')}
    },
  },
];
`;

  return output;
}

// Re-export from other modules
export { presets } from './presets.js';
export { frameworks } from './frameworks.js';
export { projectTypes } from './project-types.js';
