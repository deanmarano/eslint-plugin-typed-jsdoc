<script>
  import '../app.css';
  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';

  let { children } = $props();
</script>

<svelte:head>
  <title>typed-jsdoc - ESLint plugin for JSDoc type accuracy</title>
</svelte:head>

<div class="min-h-screen flex flex-col">
  <Header />
  <main class="flex-1">
    {@render children()}
  </main>
  <Footer />
</div>
