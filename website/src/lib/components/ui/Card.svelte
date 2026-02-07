<script>
  let { title = '', children, class: className = '' } = $props();
</script>

<div class="card p-6 {className}">
  {#if title}
    <h3 class="text-lg font-semibold mb-4">{title}</h3>
  {/if}
  {@render children()}
</div>
