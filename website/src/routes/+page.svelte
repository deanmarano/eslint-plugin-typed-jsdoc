<script>
  import { base } from '$app/paths';
  import InstallCommand from '$lib/components/ui/InstallCommand.svelte';
  import CodeBlock from '$lib/components/ui/CodeBlock.svelte';
  import summary from '$lib/data/validation-summary.json';

  const configExample = `// eslint.config.js
import tjd from 'eslint-plugin-typed-jsdoc';

export default [
  tjd.configs.recommended,
];

// Or with framework support:
// export default [
//   ...tjd.createConfig({ framework: 'next' }),
// ];`;

  const beforeCode = `/** @param {string} count */
function double(count) {
  return count * 2; // TypeScript knows this is number!
}`;

  const afterCode = `/** @param {number} count */
function double(count) {
  return count * 2;
}`;

  const features = [
    {
      title: 'Auto-fix Everything',
      description: 'Run eslint --fix and mismatches are corrected automatically.',
      icon: '⚡',
    },
    {
      title: 'TypeScript-Powered',
      description: 'Leverages TypeScript\'s type inference. No custom type analysis.',
      icon: '🔍',
    },
    {
      title: 'Zero False Positives',
      description: 'We\'d rather miss something than report incorrectly.',
      icon: '🎯',
    },
    {
      title: '2 Focused Rules',
      description: 'Fix inaccurate JSDoc. Remove redundant types. That\'s it.',
      icon: '📋',
    },
  ];

  const stats = [
    { value: summary.totals.packages.toLocaleString(), label: 'Packages Tested' },
    { value: summary.totals.files.toLocaleString(), label: 'Files Analyzed' },
    { value: (summary.byRule['tjd/accurate-jsdoc'] || 0).toLocaleString(), label: 'Type Mismatches Found' },
  ];
</script>

<svelte:head>
  <title>typed-jsdoc - ESLint plugin for JSDoc type accuracy</title>
  <meta name="description" content="ESLint plugin that compares JSDoc annotations against TypeScript's type inference and auto-fixes mismatches." />
</svelte:head>

<!-- Hero Section -->
<section class="bg-gradient-to-b from-gray-50 to-white py-20 sm:py-32">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto">
      <h1 class="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight text-balance">
        JSDoc that matches
        <span class="text-[#3178c6]">TypeScript</span>
      </h1>
      <p class="mt-6 text-xl text-gray-600 text-balance">
        ESLint plugin for JSDoc type accuracy. Compares JSDoc annotations against TypeScript's type inference and auto-fixes mismatches.
      </p>
      <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="{base}/docs/install" class="btn-primary px-6 py-3 text-base">Get Started</a>
        <a href="https://github.com/deanmarano/typedjs" class="btn-outline px-6 py-3 text-base">View on GitHub</a>
      </div>
    </div>

    <div class="mt-16 max-w-2xl mx-auto">
      <InstallCommand />
    </div>
  </div>
</section>

<!-- Before/After Section -->
<section class="py-20 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-gray-900">Catch Type Mismatches Automatically</h2>
      <p class="mt-4 text-lg text-gray-600">
        JSDoc says string, but TypeScript knows it's a number. We fix that.
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <div>
        <div class="flex items-center gap-2 mb-4">
          <span class="badge-error">Before</span>
          <span class="text-sm text-gray-500">Type mismatch</span>
        </div>
        <CodeBlock code={beforeCode} language="javascript" />
      </div>
      <div>
        <div class="flex items-center gap-2 mb-4">
          <span class="badge-success">After</span>
          <span class="text-sm text-gray-500">eslint --fix</span>
        </div>
        <CodeBlock code={afterCode} language="javascript" />
      </div>
    </div>
  </div>
</section>

<!-- Features Section -->
<section class="py-20 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl font-bold text-gray-900">Why typed-jsdoc?</h2>
      <p class="mt-4 text-lg text-gray-600">
        TypeScript is the source of truth. JSDoc should match inference, not override it.
      </p>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {#each features as feature}
        <div class="card p-6">
          <div class="text-4xl mb-4">{feature.icon}</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
          <p class="text-gray-600 text-sm">{feature.description}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Stats Section -->
<section class="py-20 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold text-gray-900">Battle-Tested</h2>
      <p class="mt-4 text-lg text-gray-600">
        Validated against popular npm packages to ensure accuracy
      </p>
    </div>

    <div class="grid grid-cols-3 gap-8">
      {#each stats as stat}
        <div class="text-center">
          <div class="text-4xl font-bold text-primary-600">{stat.value}</div>
          <div class="mt-2 text-sm text-gray-600">{stat.label}</div>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Config Section -->
<section class="py-20 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <h2 class="text-3xl font-bold text-gray-900">Simple Configuration</h2>
        <p class="mt-4 text-lg text-gray-600">
          Works with ESLint 9's flat config. Just add the plugin and enable the rules you want.
        </p>
        <ul class="mt-8 space-y-4">
          <li class="flex items-start gap-3">
            <svg class="w-6 h-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span class="text-gray-600">Three presets: <code>recommended</code>, <code>strict</code>, <code>minimal</code></span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-6 h-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span class="text-gray-600">Per-rule <code>ignorePatterns</code> for fine-grained control</span>
          </li>
          <li class="flex items-start gap-3">
            <svg class="w-6 h-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span class="text-gray-600">Works with <code>typescript-eslint</code> out of the box</span>
          </li>
        </ul>
        <div class="mt-8">
          <a href="{base}/docs/configure" class="btn-primary">View Configuration Guide</a>
        </div>
      </div>
      <div>
        <CodeBlock code={configExample} language="javascript" filename="eslint.config.js" />
      </div>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="py-20 bg-gray-900">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 class="text-3xl font-bold text-primary-400">Ready to fix your JSDoc types?</h2>
    <p class="mt-4 text-xl text-gray-300">
      Install the plugin and run eslint --fix. That's it.
    </p>
    <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
      <a href="{base}/docs/install" class="btn bg-primary-500 text-gray-900 hover:bg-primary-400 px-6 py-3 text-base font-semibold">
        Get Started
      </a>
      <a href="{base}/docs/rules" class="btn border-2 border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white px-6 py-3 text-base">
        View Rules
      </a>
    </div>
  </div>
</section>
