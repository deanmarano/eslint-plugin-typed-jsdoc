<script>
  import { base } from '$app/paths';
  import CodeBlock from '$lib/components/ui/CodeBlock.svelte';

  const recommendedConfig = `// eslint.config.js
import tjd from 'eslint-plugin-typed-jsdoc';

export default [
  tjd.configs.recommended,
];`;

  const strictConfig = `// eslint.config.js
import tjd from 'eslint-plugin-typed-jsdoc';

export default [
  tjd.configs.strict,
];`;

  const createConfigBasic = `// eslint.config.js
import tjd from 'eslint-plugin-typed-jsdoc';

export default [
  ...tjd.createConfig(),
];`;

  const createConfigWithOptions = `// eslint.config.js
import tjd from 'eslint-plugin-typed-jsdoc';

export default [
  ...tjd.createConfig({
    preset: 'strict',
    framework: 'next',
    projectType: 'app',
    ignorePatterns: ['test*', '_*'],
  }),
];`;

  const frameworkConfig = `// eslint.config.js
import tjd from 'eslint-plugin-typed-jsdoc';

export default [
  ...tjd.createConfig({ framework: 'next' }),
  // or use framework-specific preset:
  // ...tjd.configs.next,
];`;

  const ejectExample = `// Generate standalone config
import tjd from 'eslint-plugin-typed-jsdoc';
console.log(tjd.ejectConfig({ preset: 'strict', framework: 'next' }));
// Outputs a complete config you can copy into eslint.config.js`;

  const rulesOnlyConfig = `// eslint.config.js
import tjd from 'eslint-plugin-typed-jsdoc';

// Use this if you already have TypeScript parser configured
export default [
  // Your existing TypeScript parser config...
  tjd.configs['rules-only'],
];`;

  const manualConfig = `// eslint.config.js
import tsparser from '@typescript-eslint/parser';
import tjd from 'eslint-plugin-typed-jsdoc';

export default [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      tjd,
    },
    rules: {
      'tjd/accurate-jsdoc': ['error', {
        ignorePatterns: ['test*', '_*'],
      }],
      'tjd/no-redundant-jsdoc': 'warn',
    },
  },
];`;

  const ignorePatternsExample = `rules: {
  'tjd/accurate-jsdoc': ['error', {
    ignorePatterns: [
      'test*',           // Skip functions starting with "test"
      '*Callback',       // Skip functions ending with "Callback"
      '/^_/',            // Skip private functions (regex)
      'describe',        // Exact match
    ]
  }],
}`;

  const presets = [
    {
      name: 'recommended',
      description: 'Balanced defaults for most projects. Start here.',
      rules: {
        'tjd/accurate-jsdoc': 'error',
        'tjd/no-redundant-jsdoc': 'warn',
      },
    },
    {
      name: 'strict',
      description: 'All rules as errors.',
      rules: {
        'tjd/accurate-jsdoc': 'error',
        'tjd/no-redundant-jsdoc': 'error',
      },
    },
    {
      name: 'rules-only',
      description: 'Just rules, no parser config. Use if you have TypeScript parser already.',
      rules: {
        'tjd/accurate-jsdoc': 'error',
        'tjd/no-redundant-jsdoc': 'warn',
      },
    },
  ];

  const frameworks = [
    { name: 'next', description: 'Next.js - ignores .next/, includes JSX' },
    { name: 'react', description: 'React - ignores build/, includes JSX' },
    { name: 'vue', description: 'Vue - ignores dist/, .nuxt/, includes .vue files' },
    { name: 'svelte', description: 'Svelte - ignores .svelte-kit/, includes .svelte files' },
    { name: 'ember', description: 'Ember - ignores dist/, tmp/, includes .gjs files' },
    { name: 'express', description: 'Express - ignores public/' },
    { name: 'fastify', description: 'Fastify - Node.js server setup' },
    { name: 'node', description: 'Generic Node.js - .js, .mjs, .cjs files' },
  ];

  const projectTypes = [
    { name: 'app', description: 'Application (default) - standard file patterns' },
    { name: 'library', description: 'Library - stricter rules for public APIs' },
    { name: 'cli', description: 'CLI tool - includes bin/ directory' },
    { name: 'monorepo', description: 'Monorepo - handles packages/*/' },
    { name: 'legacy', description: 'Legacy project - more lenient rules' },
  ];
</script>

<svelte:head>
  <title>Configuration - typed-jsdoc</title>
  <meta name="description" content="Configure eslint-plugin-typed-jsdoc rules and presets for your project." />
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
  <h1 class="text-4xl font-bold text-gray-900 mb-8">Configuration</h1>

  <div class="prose prose-lg max-w-none">
    <p class="lead text-xl text-gray-600">
      All presets use TypeScript's <code>projectService</code> for zero-config support.
      No <code>tsconfig.json</code> required (though recommended for better inference).
    </p>

    <h2>Quick Start</h2>
    <p>
      The simplest configuration uses a preset:
    </p>
  </div>

  <div class="my-8">
    <CodeBlock code={recommendedConfig} language="javascript" filename="eslint.config.js" />
  </div>

  <div class="prose prose-lg max-w-none">
    <h2>Preset Configurations</h2>
    <p>
      Choose a preset that matches your needs:
    </p>
  </div>

  <div class="my-8 grid gap-6">
    {#each presets as preset}
      <div class="card p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">{preset.name}</h3>
        <p class="text-gray-600 mb-4">{preset.description}</p>
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">Rules included:</h4>
          <ul class="space-y-1">
            {#each Object.entries(preset.rules) as [rule, level]}
              <li class="flex items-center gap-2 text-sm">
                <code class="text-xs">{rule}</code>
                <span class="badge {level === 'error' ? 'badge-error' : 'badge-warning'}">{level}</span>
              </li>
            {/each}
          </ul>
        </div>
      </div>
    {/each}
  </div>

  <div class="prose prose-lg max-w-none">
    <h2>Config Factory</h2>
    <p>
      For more control, use the <code>createConfig()</code> factory function:
    </p>
  </div>

  <div class="my-8">
    <CodeBlock code={createConfigWithOptions} language="javascript" filename="eslint.config.js" />
  </div>

  <div class="prose prose-lg max-w-none">
    <h3>Factory Options</h3>
    <ul>
      <li><code>preset</code> - Rule severity: <code>'recommended'</code> (warn) | <code>'strict'</code> (error)</li>
      <li><code>framework</code> - Framework-specific file patterns and ignores</li>
      <li><code>projectType</code> - Affects file patterns: <code>'app'</code> | <code>'library'</code> | <code>'cli'</code> | <code>'monorepo'</code> | <code>'legacy'</code></li>
      <li><code>typescript</code> - Custom tsconfig: <code>{'{ project: "./tsconfig.json" }'}</code></li>
      <li><code>files</code> - Additional file patterns to include</li>
      <li><code>ignores</code> - Additional patterns to ignore</li>
      <li><code>rules</code> - Rule severity overrides</li>
      <li><code>ignorePatterns</code> - Function names to skip</li>
    </ul>

    <h2>Framework Presets</h2>
    <p>
      Built-in support for popular frameworks:
    </p>
  </div>

  <div class="my-8 overflow-x-auto">
    <table class="w-full text-sm">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-2 text-left font-medium text-gray-600">Framework</th>
          <th class="px-4 py-2 text-left font-medium text-gray-600">Description</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        {#each frameworks as fw}
          <tr>
            <td class="px-4 py-2"><code>{fw.name}</code></td>
            <td class="px-4 py-2 text-gray-600">{fw.description}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="my-8">
    <CodeBlock code={frameworkConfig} language="javascript" filename="eslint.config.js" />
  </div>

  <div class="prose prose-lg max-w-none">
    <h2>Project Types</h2>
    <p>
      Project types adjust file patterns and rule strictness:
    </p>
  </div>

  <div class="my-8 overflow-x-auto">
    <table class="w-full text-sm">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-2 text-left font-medium text-gray-600">Type</th>
          <th class="px-4 py-2 text-left font-medium text-gray-600">Description</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        {#each projectTypes as pt}
          <tr>
            <td class="px-4 py-2"><code>{pt.name}</code></td>
            <td class="px-4 py-2 text-gray-600">{pt.description}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="prose prose-lg max-w-none">
    <h2>Existing TypeScript Setup</h2>
    <p>
      If you already have <code>@typescript-eslint/parser</code> configured, use the <code>rules-only</code> preset:
    </p>
  </div>

  <div class="my-8">
    <CodeBlock code={rulesOnlyConfig} language="javascript" filename="eslint.config.js" />
  </div>

  <div class="prose prose-lg max-w-none">
    <h2>Manual Configuration</h2>
    <p>
      For full control over parser options:
    </p>
  </div>

  <div class="my-8">
    <CodeBlock code={manualConfig} language="javascript" filename="eslint.config.js" />
  </div>

  <div class="prose prose-lg max-w-none">
    <h2>Eject Config</h2>
    <p>
      Generate a standalone config to customize further:
    </p>
  </div>

  <div class="my-8">
    <CodeBlock code={ejectExample} language="javascript" />
  </div>

  <div class="prose prose-lg max-w-none">
    <h2>Common Options</h2>

    <h3>ignorePatterns</h3>
    <p>
      Skip functions or variables by name pattern. Available on all rules.
      Supports three pattern formats:
    </p>
    <ul>
      <li><code>"helper"</code> - Exact match</li>
      <li><code>"test*"</code> - Glob pattern</li>
      <li><code>"/^_/"</code> - Regex pattern</li>
    </ul>
  </div>

  <div class="my-8">
    <CodeBlock code={ignorePatternsExample} language="javascript" />
  </div>

  <div class="prose prose-lg max-w-none">
    <h3>Rule-Specific Options</h3>

    <h4>tjd/accurate-jsdoc</h4>
    <ul>
      <li><code>inferenceConfidence</code> (default: <code>0.5</code>) - Minimum confidence (0-1) for auto-fixing. Higher values require more certain type inference.</li>
    </ul>

    <h4>tjd/no-redundant-jsdoc</h4>
    <ul>
      <li><code>keepDescriptions</code> (default: <code>true</code>) - Keep JSDoc comments that have descriptions, only remove the type annotation</li>
    </ul>

    <h2>Next Steps</h2>
    <ul>
      <li><a href="{base}/docs/rules">Learn about each rule</a> in detail</li>
      <li><a href="https://github.com/deanmarano/typedjs">View the source code</a> on GitHub</li>
    </ul>
  </div>
</div>
