<script>
  import { base } from '$app/paths';
  import InstallCommand from '$lib/components/ui/InstallCommand.svelte';
  import CodeBlock from '$lib/components/ui/CodeBlock.svelte';

  const eslintConfigBasic = `// eslint.config.js
import tjd from 'eslint-plugin-typed-jsdoc';

export default [
  tjd.configs.recommended,
];`;

  const eslintConfigFactory = `// eslint.config.js
import tjd from 'eslint-plugin-typed-jsdoc';

export default [
  ...tjd.createConfig({
    preset: 'recommended',
    framework: 'next',  // or 'react', 'vue', 'express', etc.
  }),
];`;

  const tsconfigExample = `{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "noEmit": true
  },
  "include": ["**/*.js", "**/*.mjs", "**/*.jsx"]
}`;
</script>

<svelte:head>
  <title>Installation - typed-jsdoc</title>
  <meta name="description" content="Install eslint-plugin-typed-jsdoc and set up your project for JSDoc type checking." />
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
  <h1 class="text-4xl font-bold text-gray-900 mb-8">Installation</h1>

  <div class="prose prose-lg max-w-none">
    <h2>Quick Install</h2>
    <p>
      Install the plugin along with its peer dependencies:
    </p>
  </div>

  <div class="my-8">
    <InstallCommand />
  </div>

  <div class="prose prose-lg max-w-none">
    <h2>Prerequisites</h2>
    <ul>
      <li><strong>Node.js 18+</strong> - Required for modern JavaScript features</li>
      <li><strong>ESLint 9+</strong> - Uses the new flat config format</li>
      <li><strong>TypeScript 5+</strong> - Required for type inference (installed as peer dependency)</li>
    </ul>

    <h2>Peer Dependencies</h2>
    <p>
      The plugin requires these peer dependencies:
    </p>
    <ul>
      <li><code>eslint</code> ^9.0.0</li>
      <li><code>@typescript-eslint/parser</code> ^8.0.0</li>
      <li><code>typescript</code> ^5.0.0</li>
    </ul>

    <h2>ESLint Configuration</h2>
    <p>
      The simplest setup uses a preset config:
    </p>
  </div>

  <div class="my-8">
    <CodeBlock code={eslintConfigBasic} language="javascript" filename="eslint.config.js" />
  </div>

  <div class="prose prose-lg max-w-none">
    <p>
      Or use the <code>createConfig()</code> factory for framework-specific setups:
    </p>
  </div>

  <div class="my-8">
    <CodeBlock code={eslintConfigFactory} language="javascript" filename="eslint.config.js" />
  </div>

  <div class="prose prose-lg max-w-none">
    <h2>TypeScript Configuration (Optional)</h2>
    <p>
      The plugin uses TypeScript's <code>projectService</code> by default, which provides
      zero-config support. However, for better type inference, you can create a <code>tsconfig.json</code>:
    </p>
  </div>

  <div class="my-8">
    <CodeBlock code={tsconfigExample} language="json" filename="tsconfig.json" />
  </div>

  <div class="prose prose-lg max-w-none">
    <p>
      The key settings are:
    </p>
    <ul>
      <li><code>allowJs: true</code> - Let TypeScript process JavaScript files</li>
      <li><code>checkJs: true</code> - Enable type checking for JavaScript</li>
      <li><code>noEmit: true</code> - Don't generate output files</li>
    </ul>

    <h2>Verify Installation</h2>
    <p>
      Run ESLint to verify everything is working:
    </p>
  </div>

  <div class="my-8">
    <CodeBlock code="npx eslint src/" language="bash" />
  </div>

  <div class="prose prose-lg max-w-none">
    <p>
      If you see JSDoc-related warnings or errors, the plugin is working correctly.
    </p>

    <h2>Next Steps</h2>
    <ul>
      <li><a href="{base}/docs/configure">Configure the rules</a> to match your project's needs</li>
      <li><a href="{base}/docs/rules">Learn about each rule</a> and what it catches</li>
    </ul>
  </div>
</div>
