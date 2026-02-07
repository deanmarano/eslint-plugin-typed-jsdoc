<script>
  import CodeBlock from '$lib/components/ui/CodeBlock.svelte';

  const rules = [
    {
      name: 'accurate-jsdoc',
      description: 'JSDoc types must match TypeScript\'s inference. Auto-fixes mismatches.',
      fixable: true,
      badCode: `/** @returns {string} */
function getValue() {
  return 42;
}`,
      goodCode: `/** @returns {number} */
function getValue() {
  return 42;
}`,
      options: [
        { name: 'ignorePatterns', type: 'string[]', default: '[]', description: 'Function names to skip' },
        { name: 'inferenceConfidence', type: 'number', default: '0.5', description: 'Minimum confidence for auto-fix (0-1)' },
      ],
    },
    {
      name: 'no-redundant-jsdoc',
      description: 'Remove JSDoc type annotations that don\'t add information beyond what TypeScript infers.',
      fixable: true,
      badCode: `/** @type {string} */
const name = String(input);`,
      goodCode: `const name = String(input);`,
      options: [
        { name: 'keepDescriptions', type: 'boolean', default: 'true', description: 'Preserve JSDoc with descriptions' },
        { name: 'ignorePatterns', type: 'string[]', default: '[]', description: 'Variable names to skip' },
      ],
    },
  ];
</script>

<svelte:head>
  <title>Rules - typed-jsdoc</title>
  <meta name="description" content="Complete documentation for all eslint-plugin-typed-jsdoc rules." />
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
  <h1 class="text-4xl font-bold text-gray-900 mb-8">Rules</h1>

  <div class="prose prose-lg max-w-none mb-12">
    <p>
      typed-jsdoc provides two rules that keep your JSDoc
      accurate and in sync with TypeScript's type inference.
    </p>
  </div>

  <div class="space-y-16">
    {#each rules as rule}
      <section id={rule.name} class="scroll-mt-24">
        <div class="flex items-center gap-3 mb-4">
          <h2 class="text-2xl font-bold text-gray-900">tjd/{rule.name}</h2>
          {#if rule.fixable}
            <span class="badge-success">Fixable</span>
          {/if}
        </div>

        <p class="text-lg text-gray-600 mb-6">{rule.description}</p>

        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="badge-error">Bad</span>
            </div>
            <CodeBlock code={rule.badCode} language="javascript" />
          </div>
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="badge-success">Good</span>
            </div>
            <CodeBlock code={rule.goodCode} language="javascript" />
          </div>
        </div>

        {#if rule.options.length > 0}
          <div class="card p-4">
            <h3 class="text-sm font-semibold text-gray-900 mb-3">Options</h3>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-2 font-medium text-gray-600">Option</th>
                  <th class="text-left py-2 font-medium text-gray-600">Type</th>
                  <th class="text-left py-2 font-medium text-gray-600">Default</th>
                  <th class="text-left py-2 font-medium text-gray-600">Description</th>
                </tr>
              </thead>
              <tbody>
                {#each rule.options as option}
                  <tr class="border-b border-gray-100">
                    <td class="py-2"><code class="text-xs">{option.name}</code></td>
                    <td class="py-2"><code class="text-xs">{option.type}</code></td>
                    <td class="py-2"><code class="text-xs">{option.default}</code></td>
                    <td class="py-2 text-gray-600">{option.description}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </section>
    {/each}
  </div>

  <div class="mt-16 prose prose-lg max-w-none">
    <h2>Type Comparison</h2>
    <p>
      The plugin handles common type equivalences when comparing JSDoc to TypeScript types:
    </p>
    <ul>
      <li><code>Array&lt;T&gt;</code> matches <code>T[]</code></li>
      <li><code>String</code>/<code>Number</code>/<code>Boolean</code> match <code>string</code>/<code>number</code>/<code>boolean</code></li>
      <li><code>?T</code> (nullable) matches <code>T | null</code> or <code>T | undefined</code></li>
      <li><code>*</code> matches <code>any</code> or <code>unknown</code></li>
      <li>Union types with different ordering (e.g., <code>string | number</code> matches <code>number | string</code>)</li>
      <li><code>void</code> matches <code>undefined</code></li>
    </ul>
  </div>
</div>
