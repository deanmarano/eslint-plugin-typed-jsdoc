# eslint-plugin-typed-jsdoc

[![Documentation](https://img.shields.io/badge/docs-website-blue)](https://deanmarano.github.io/eslint-plugin-typed-jsdoc/)

ESLint plugin that keeps JSDoc types in sync with TypeScript's inference. Auto-fixes mismatches with `eslint --fix`.

**[View Documentation →](https://deanmarano.github.io/eslint-plugin-typed-jsdoc/)**

## Installation

```bash
npm install eslint-plugin-typed-jsdoc @typescript-eslint/parser typescript --save-dev
```

## Quick Start

```javascript
// eslint.config.js
import tjd from 'eslint-plugin-typed-jsdoc';

export default [
  tjd.configs.recommended,
];
```

That's it. The preset includes TypeScript parser configuration automatically.

## Rules

### `tjd/accurate-jsdoc`

JSDoc types must match TypeScript's inference. Auto-fixes mismatches.

```javascript
// Before: JSDoc says string, TypeScript infers number
/** @returns {string} */
function getValue() {
  return 42;
}

// After: eslint --fix
/** @returns {number} */
function getValue() {
  return 42;
}
```

### `tjd/no-redundant-jsdoc`

Remove JSDoc type annotations that don't add information beyond what TypeScript infers.

```javascript
// Before: Type is obvious from the literal
/** @type {string} */
const name = String(input);

// After: eslint --fix
const name = String(input);
```

## Configuration

### Presets

```javascript
// Recommended (default)
tjd.configs.recommended
// - tjd/accurate-jsdoc: error
// - tjd/no-redundant-jsdoc: warn

// Strict
tjd.configs.strict
// - tjd/accurate-jsdoc: error
// - tjd/no-redundant-jsdoc: error
```

### Ignore Patterns

Skip functions by name:

```javascript
export default [
  tjd.configs.recommended,
  {
    rules: {
      'tjd/accurate-jsdoc': ['error', {
        ignorePatterns: ['test*', '_*', '/^describe|it$/'],
      }],
    },
  },
];
```

### Framework Support

```javascript
import tjd from 'eslint-plugin-typed-jsdoc';

export default [
  ...tjd.createConfig({ framework: 'next' }),
];
```

Supported: `next`, `react`, `vue`, `svelte`, `ember`, `express`, `fastify`, `node`

## How It Works

The plugin uses TypeScript's type inference via `@typescript-eslint/parser`. When you run ESLint:

1. TypeScript analyzes your JavaScript code
2. We compare JSDoc annotations against inferred types
3. Mismatches are reported with auto-fix

No custom type inference - just TypeScript's battle-tested type checker.

## License

MIT
