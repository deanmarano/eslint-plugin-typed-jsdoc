import summary from '$lib/data/validation-summary.json';

// Import all package reports to calculate filtered issue counts
const packageModules = import.meta.glob('$lib/data/packages/*.json', { eager: true });

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  // Process each package to get filtered issue counts
  const packagesWithFilteredCounts = summary.packages.map((pkg) => {
    const matchingKey = Object.keys(packageModules).find(key => key.endsWith(`/${pkg.name}.json`));

    if (!matchingKey) {
      return { ...pkg, filteredIssues: 0, issuesByRule: {} };
    }

    const report = packageModules[matchingKey].default;
    const issues = report.issues || [];

    // Filter to only the two core rules
    const coreRules = ['tjd/accurate-jsdoc', 'tjd/no-redundant-jsdoc'];
    const filteredIssues = issues.filter((issue) =>
      coreRules.includes(issue.rule)
    );

    // Count issues per rule for this package
    /** @type {Record<string, number>} */
    const issuesByRule = {};
    for (const issue of filteredIssues) {
      if (issue.rule) {
        issuesByRule[issue.rule] = (issuesByRule[issue.rule] || 0) + 1;
      }
    }

    return {
      ...pkg,
      filteredIssues: filteredIssues.length,
      issuesByRule,
    };
  });

  // Calculate total filtered issues
  const totalFilteredIssues = packagesWithFilteredCounts.reduce(
    (sum, pkg) => sum + pkg.filteredIssues,
    0
  );

  // Get filtered rule counts (only core rules)
  const coreRules = ['tjd/accurate-jsdoc', 'tjd/no-redundant-jsdoc'];
  const filteredByRule = Object.entries(summary.byRule)
    .filter(([rule]) => coreRules.includes(rule))
    .reduce((acc, [rule, count]) => {
      acc[rule] = count;
      return acc;
    }, /** @type {Record<string, number>} */ ({}));

  return {
    packages: packagesWithFilteredCounts,
    totals: {
      ...summary.totals,
      filteredIssues: totalFilteredIssues,
    },
    byRule: filteredByRule,
    generatedAt: summary.generatedAt,
  };
}
