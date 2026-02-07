<script>
  import { base } from '$app/paths';

  export let data;
  const report = data.report;

  // Only show the two core rules
  const coreRules = ['tjd/accurate-jsdoc', 'tjd/no-redundant-jsdoc'];
  const filteredIssues = (report.issues || []).filter((issue) =>
    coreRules.includes(issue.rule)
  );

  // Group issues by file
  const issuesByFile = filteredIssues.reduce((acc, issue) => {
    if (!acc[issue.file]) {
      acc[issue.file] = [];
    }
    acc[issue.file].push(issue);
    return acc;
  }, {});

  const files = Object.keys(issuesByFile).sort();

  // Get rule counts (only core rules)
  const ruleEntries = Object.entries(report.byRule || {})
    .filter(([rule]) => coreRules.includes(rule))
    .sort((a, b) => Number(b[1]) - Number(a[1]));

  // Calculate totals for core rules only
  const totalIssues = filteredIssues.length;
  const errorCount = filteredIssues.filter((i) => i.severity === 'error').length;
  const warningCount = filteredIssues.filter((i) => i.severity === 'warning').length;

  function formatNumber(n) {
    return n.toLocaleString();
  }

  function getRuleColor(rule) {
    switch (rule) {
      case 'tjd/accurate-jsdoc': return 'text-red-600 bg-red-50';
      case 'tjd/no-redundant-jsdoc': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }

  function getRuleBadge(rule) {
    const short = rule.replace('tjd/', '');
    return short;
  }
</script>

<svelte:head>
  <title>{report.name} - Validation Results - typed-jsdoc</title>
  <meta name="description" content="Validation results for {report.name} - {report.totalIssues} issues found across {report.filesAnalyzed} files." />
</svelte:head>

<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
  <!-- Breadcrumb -->
  <nav class="mb-8">
    <a href="{base}/docs/validation" class="text-primary-600 hover:text-primary-800">
      ← Back to Validation Results
    </a>
  </nav>

  <!-- Header -->
  <div class="flex items-start justify-between mb-8">
    <div>
      <h1 class="text-4xl font-bold text-gray-900 mb-2">{report.name}</h1>
      <a
        href="https://www.npmjs.com/package/{report.name}"
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary-600 hover:text-primary-800 text-sm"
      >
        View on npm →
      </a>
    </div>
  </div>

  <!-- Summary Stats -->
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
    <div class="card p-4 text-center">
      <div class="text-2xl font-bold text-gray-900">{formatNumber(report.filesAnalyzed)}</div>
      <div class="text-sm text-gray-600">Files Analyzed</div>
    </div>
    <div class="card p-4 text-center">
      <div class="text-2xl font-bold {totalIssues > 0 ? 'text-red-600' : 'text-green-600'}">
        {formatNumber(totalIssues)}
      </div>
      <div class="text-sm text-gray-600">Issues Found</div>
    </div>
    <div class="card p-4 text-center">
      <div class="text-2xl font-bold text-gray-900">{files.length}</div>
      <div class="text-sm text-gray-600">Files with Issues</div>
    </div>
  </div>

  <!-- Issues by Rule -->
  {#if ruleEntries.length > 0}
    <div class="card p-6 mb-8">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Issues by Rule</h2>
      <div class="space-y-2">
        {#each ruleEntries as [rule, count]}
          <div class="flex items-center gap-4">
            <code class="text-sm px-2 py-1 rounded {getRuleColor(rule)}">{rule}</code>
            <div class="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                class="bg-primary-500 h-full rounded-full"
                style="width: {Math.min(100, (Number(count) / Number(ruleEntries[0][1])) * 100)}%"
              ></div>
            </div>
            <span class="text-sm text-gray-600 w-16 text-right">{formatNumber(Number(count))}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Issues by File -->
  {#if files.length > 0}
    <div class="space-y-6">
      <h2 class="text-xl font-semibold text-gray-900">Issues by File</h2>

      {#each files as file}
        {@const fileIssues = issuesByFile[file]}
        <div class="card overflow-hidden">
          <div class="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <code class="text-sm text-gray-700">{file}</code>
            <span class="text-sm text-gray-500">{fileIssues.length} issue{fileIssues.length === 1 ? '' : 's'}</span>
          </div>
          <div class="divide-y divide-gray-100">
            {#each fileIssues as issue}
                <div class="px-4 py-3 hover:bg-gray-50">
                  <div class="flex items-start gap-3">
                    <span class="text-xs text-gray-400 font-mono w-16 flex-shrink-0 pt-0.5">
                      {issue.line}:{issue.column}
                    </span>
                    <span class="text-xs px-2 py-0.5 rounded {getRuleColor(issue.rule)} flex-shrink-0">
                      {getRuleBadge(issue.rule)}
                    </span>
                    <p class="text-sm text-gray-700 flex-1">{issue.message}</p>
                  </div>
                </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="card p-8 text-center">
      <div class="text-green-600 text-4xl mb-4">✓</div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">No Issues Found</h2>
      <p class="text-gray-600">This package passed all typed-jsdoc checks.</p>
    </div>
  {/if}

  <div class="mt-8 text-sm text-gray-500">
    <p>Analyzed: {new Date(report.lintedAt).toLocaleDateString()}</p>
  </div>
</div>
