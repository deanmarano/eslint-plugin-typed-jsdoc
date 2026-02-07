<script>
  import { base } from '$app/paths';
</script>

<footer class="border-t border-gray-200 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div class="col-span-1 md:col-span-2">
        <div class="flex items-center gap-2 font-semibold text-gray-900 mb-4">
          <span class="text-2xl">JS</span>
          <span>typed-jsdoc</span>
        </div>
        <p class="text-sm text-gray-600 max-w-md">
          ESLint plugin for JSDoc type accuracy. Compares JSDoc annotations against TypeScript's type inference and auto-fixes mismatches.
        </p>
      </div>
      <div>
        <h3 class="text-sm font-semibold text-gray-900 mb-4">Documentation</h3>
        <ul class="space-y-3">
          <li><a href="{base}/docs/install" class="text-sm text-gray-600 hover:text-gray-900">Installation</a></li>
          <li><a href="{base}/docs/configure" class="text-sm text-gray-600 hover:text-gray-900">Configuration</a></li>
          <li><a href="{base}/docs/rules" class="text-sm text-gray-600 hover:text-gray-900">Rules</a></li>
          <li><a href="{base}/docs/validation" class="text-sm text-gray-600 hover:text-gray-900">Validation</a></li>
        </ul>
      </div>
      <div>
        <h3 class="text-sm font-semibold text-gray-900 mb-4">Resources</h3>
        <ul class="space-y-3">
          <li><a href="https://github.com/deanmarano/typedjs" target="_blank" rel="noopener noreferrer" class="text-sm text-gray-600 hover:text-gray-900">GitHub</a></li>
          <li><a href="https://www.npmjs.com/package/eslint-plugin-typed-jsdoc" target="_blank" rel="noopener noreferrer" class="text-sm text-gray-600 hover:text-gray-900">npm</a></li>
          <li><a href="https://github.com/deanmarano/typedjs/issues" target="_blank" rel="noopener noreferrer" class="text-sm text-gray-600 hover:text-gray-900">Issues</a></li>
        </ul>
      </div>
    </div>
    <div class="mt-12 pt-8 border-t border-gray-200">
      <p class="text-sm text-gray-500 text-center">
        MIT License. Built by <a href="https://github.com/deanmarano" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-gray-900">Dean Marano</a>.
      </p>
    </div>
  </div>
</footer>
