import summary from '$lib/data/validation-summary.json';

/** @type {import('./$types').EntryGenerator} */
export function entries() {
  return summary.packages.map((pkg) => ({
    package: pkg.name
  }));
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  const packageName = params.package;

  // Dynamic import of the package report
  const report = await import(`$lib/data/packages/${packageName}.json`);

  return {
    report: report.default
  };
}
