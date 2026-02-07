<script>
  import { base } from '$app/paths';

  export let data;

  // Available rules (from server data)
  const allRules = Object.keys(data.byRule);

  // Rule toggle state - all enabled by default
  /** @type {Record<string, boolean>} */
  let enabledRules = Object.fromEntries(
    allRules.map(rule => [rule, true])
  );

  // Filter packages based on enabled rules
  $: packagesWithCounts = data.packages.map((pkg) => {
    // Get the package's issues filtered by enabled rules
    const enabledIssueCount = Object.entries(pkg.issuesByRule || {})
      .filter(([rule]) => enabledRules[rule])
      .reduce((sum, [, count]) => sum + Number(count), 0);
    return { ...pkg, displayedIssues: enabledIssueCount };
  });

  // Sort packages by displayed issues descending
  $: packages = [...packagesWithCounts].sort((a, b) => b.displayedIssues - a.displayedIssues);

  // Get rules filtered by enabled state
  $: topRules = Object.entries(data.byRule)
    .filter(([rule]) => enabledRules[rule])
    .sort((a, b) => Number(b[1]) - Number(a[1]));

  // Calculate totals based on enabled rules
  $: totalFilteredIssues = Object.entries(data.byRule)
    .filter(([rule]) => enabledRules[rule])
    .reduce((sum, [, count]) => sum + Number(count), 0);

  let searchQuery = '';
  let sortBy = 'issues';
  let sortDir = 'desc';

  function toggleRule(rule) {
    enabledRules[rule] = !enabledRules[rule];
    enabledRules = enabledRules; // Trigger reactivity
  }

  $: filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  $: sortedPackages = [...filteredPackages].sort((a, b) => {
    let aVal, bVal;
    switch (sortBy) {
      case 'name': aVal = a.name; bVal = b.name; break;
      case 'files': aVal = a.filesAnalyzed; bVal = b.filesAnalyzed; break;
      case 'issues': aVal = a.displayedIssues; bVal = b.displayedIssues; break;
      default: aVal = a.displayedIssues; bVal = b.displayedIssues;
    }
    if (typeof aVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  function toggleSort(column) {
    if (sortBy === column) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = column;
      sortDir = 'desc';
    }
  }

  function formatNumber(n) {
    return n.toLocaleString();
  }
</script>

<svelte:head>
  <title>Validation Results - typed-jsdoc</title>
  <meta name="description" content="Results from running typed-jsdoc against {data.totals.packages} popular npm packages." />
</svelte:head>

<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
  <h1 class="text-4xl font-bold text-gray-900 mb-4">Validation Results</h1>
  <p class="text-lg text-gray-600 mb-8">
    We ran typed-jsdoc against {formatNumber(data.totals.packages)} popular npm packages to validate accuracy and find real-world issues.
  </p>

  <!-- Summary Stats -->
  <div class="grid grid-cols-3 gap-6 mb-12">
    <div class="card p-6 text-center">
      <div class="text-3xl font-bold text-primary-600">{formatNumber(data.totals.packages)}</div>
      <div class="text-sm text-gray-600 mt-1">Packages</div>
    </div>
    <div class="card p-6 text-center">
      <div class="text-3xl font-bold text-primary-600">{formatNumber(data.totals.files)}</div>
      <div class="text-sm text-gray-600 mt-1">Files Analyzed</div>
    </div>
    <div class="card p-6 text-center">
      <div class="text-3xl font-bold text-red-600">{formatNumber(totalFilteredIssues)}</div>
      <div class="text-sm text-gray-600 mt-1">Issues Found</div>
    </div>
  </div>

  <!-- Issues by Rule -->
  <div class="card p-6 mb-12">
    <h2 class="text-xl font-semibold text-gray-900 mb-4">Filter by Rule</h2>
    <p class="text-sm text-gray-600 mb-4">Toggle rules to filter the results below.</p>
    <div class="space-y-3">
      {#each allRules as rule}
        {@const count = data.byRule[rule] || 0}
        {@const isEnabled = enabledRules[rule]}
        <div class="flex items-center gap-4">
          <button
            on:click={() => toggleRule(rule)}
            class="w-12 h-6 rounded-full transition-colors relative flex-shrink-0 {isEnabled ? 'bg-primary-500' : 'bg-gray-300'}"
            aria-pressed={isEnabled}
            aria-label="Toggle {rule}"
          >
            <span class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform {isEnabled ? 'translate-x-6' : ''}"></span>
          </button>
          <code class="text-sm px-2 py-1 rounded flex-shrink-0 {isEnabled ? 'bg-gray-100' : 'bg-gray-50 text-gray-400'}">{rule}</code>
          <div class="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              class="h-full rounded-full transition-all {isEnabled ? 'bg-primary-500' : 'bg-gray-300'}"
              style="width: {Math.min(100, (count / (data.byRule[allRules[0]] || 1)) * 100)}%"
            ></div>
          </div>
          <span class="text-sm w-20 text-right {isEnabled ? 'text-gray-600' : 'text-gray-400'}">{formatNumber(count)}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Package Results -->
  <div class="card overflow-hidden">
    <div class="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-900">Package Results</h2>
      <input
        type="text"
        placeholder="Search packages..."
        bind:value={searchQuery}
        class="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64"
      />
    </div>

    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th
              class="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
              on:click={() => toggleSort('name')}
            >
              Package {sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th
              class="px-4 py-3 text-right text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
              on:click={() => toggleSort('files')}
            >
              Files {sortBy === 'files' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th
              class="px-4 py-3 text-right text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
              on:click={() => toggleSort('issues')}
            >
              Issues {sortBy === 'issues' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-600">
              Types
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          {#each sortedPackages as pkg}
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <a
                  href="{base}/docs/validation/{pkg.name}"
                  class="text-primary-600 hover:text-primary-800 font-medium"
                >
                  {pkg.name}
                </a>
              </td>
              <td class="px-4 py-3 text-right text-sm text-gray-600">
                {formatNumber(pkg.filesAnalyzed)}
              </td>
              <td class="px-4 py-3 text-right text-sm">
                {#if pkg.displayedIssues > 0}
                  <span class="font-medium">{formatNumber(pkg.displayedIssues)}</span>
                {:else}
                  <span class="text-green-600 font-medium">0</span>
                {/if}
              </td>
              <td class="px-4 py-3 text-sm">
                {#if pkg.typesPackage}
                  <span class="text-green-600">{pkg.typesPackage}</span>
                {:else}
                  <span class="text-gray-400">built-in</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="p-4 border-t border-gray-200 text-sm text-gray-500">
      Showing {sortedPackages.length} of {packages.length} packages
    </div>
  </div>

  <div class="mt-8 text-sm text-gray-500">
    <p>Generated: {new Date(data.generatedAt).toLocaleDateString()}</p>
  </div>
</div>
