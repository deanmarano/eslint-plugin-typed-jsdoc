<script>
  let activeTab = $state('npm');
  let copied = $state(false);

  const commands = {
    npm: 'npm install eslint-plugin-typed-jsdoc @typescript-eslint/parser typescript --save-dev',
    pnpm: 'pnpm add -D eslint-plugin-typed-jsdoc @typescript-eslint/parser typescript',
    yarn: 'yarn add -D eslint-plugin-typed-jsdoc @typescript-eslint/parser typescript',
  };

  async function copyToClipboard() {
    await navigator.clipboard.writeText(commands[activeTab]);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }
</script>

<div class="rounded-lg border border-gray-200 overflow-hidden">
  <div class="flex items-center border-b border-gray-200 bg-gray-50">
    {#each Object.keys(commands) as tab}
      <button
        type="button"
        onclick={() => activeTab = tab}
        class="px-4 py-2 text-sm font-medium transition-colors {activeTab === tab ? 'text-primary-600 bg-white border-b-2 border-primary-600 -mb-px' : 'text-gray-600 hover:text-gray-900'}"
      >
        {tab}
      </button>
    {/each}
  </div>
  <div class="relative">
    <pre class="!m-0 !rounded-none text-sm"><code>{commands[activeTab]}</code></pre>
    <button
      type="button"
      onclick={copyToClipboard}
      class="absolute top-2 right-2 p-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
      aria-label="Copy to clipboard"
    >
      {#if copied}
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      {:else}
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      {/if}
    </button>
  </div>
</div>
