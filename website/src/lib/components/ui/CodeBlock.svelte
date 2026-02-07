<script>
  let { code, language = 'javascript', filename = '' } = $props();
</script>

<div class="rounded-lg overflow-hidden border border-gray-200">
  {#if filename}
    <div class="px-4 py-2 bg-gray-100 border-b border-gray-200 text-sm text-gray-600 font-mono">
      {filename}
    </div>
  {/if}
  <pre class="!m-0 !rounded-none"><code class="language-{language}">{code}</code></pre>
</div>
