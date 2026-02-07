/**
 * eslint-plugin-typed-jsdoc
 *
 * ESLint plugin for JSDoc type accuracy - compares JSDoc to TypeScript inference.
 */

import tsparser from '@typescript-eslint/parser';
import accurateJsdoc from './rules/accurate-jsdoc.js';
import noRedundantJsdoc from './rules/no-redundant-jsdoc.js';
import noImplicitAny from './rules/no-implicit-any.js';
import requireJsdocTypes from './rules/require-jsdoc-types.js';
import {
  createConfig as createConfigImpl,
  ejectConfig as ejectConfigImpl,
  setPluginRef,
} from './config/index.js';

/**
 * @typedef {import('./config/types.js').CreateConfigOptions} CreateConfigOptions
 * @typedef {import('./config/types.js').FlatConfigArray} FlatConfigArray
 */

/**
 * Shared language options for parsing JavaScript with TypeScript's type checker.
 * Uses projectService for zero-config TypeScript support (no tsconfig.json needed).
 *
 * Note: Projects using this plugin should have a tsconfig.json that includes their JS files:
 * {
 *   "compilerOptions": { "allowJs": true, "checkJs": true, "noEmit": true },
 *   "include": ["**\/*.js", "**\/*.mjs", "**\/*.jsx"]
 * }
 */
const baseLanguageOptions = {
  parser: tsparser,
  parserOptions: {
    // projectService enables type-aware linting with tsconfig.json
    projectService: true,
    // Enable JSX parsing
    ecmaFeatures: {
      jsx: true,
    },
  },
};

/** File patterns for JavaScript files including JSX */
const jsFilePatterns = ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.jsx'];

/** File patterns for Next.js projects */
const nextFilePatterns = ['**/*.js', '**/*.mjs', '**/*.jsx'];

/** File patterns for Ember projects (includes Glimmer components) */
const emberFilePatterns = ['**/*.js', '**/*.mjs', '**/*.gjs'];

/**
 * Create config factory wrapper that's bound to the plugin.
 *
 * @param {CreateConfigOptions} [options]
 * @returns {FlatConfigArray}
 */
function createConfig(options) {
  return createConfigImpl(options);
}

/**
 * Eject config wrapper that returns standalone config string.
 *
 * @param {CreateConfigOptions} [options]
 * @returns {string}
 */
function ejectConfig(options) {
  return ejectConfigImpl(options);
}

const plugin = {
  meta: {
    name: 'eslint-plugin-typed-jsdoc',
    version: '0.1.0',
  },
  rules: {
    'accurate-jsdoc': accurateJsdoc,
    'no-redundant-jsdoc': noRedundantJsdoc,
    'no-implicit-any': noImplicitAny,
    'require-jsdoc-types': requireJsdocTypes,
  },
  configs: /** @type {Record<string, unknown>} */ ({}),
  createConfig,
  ejectConfig,
};

// Set the plugin reference for config factory
setPluginRef(plugin);

// Define configs after plugin is created so we can reference it
Object.assign(plugin.configs, {
  /**
   * Recommended config for most JavaScript projects.
   * - Ensures JSDoc matches TypeScript inference (errors)
   * - Removes redundant JSDoc type annotations (warns)
   *
   * No tsconfig.json required - uses TypeScript's projectService.
   * Includes JSX support.
   */
  recommended: {
    name: 'typed-jsdoc/recommended',
    files: jsFilePatterns,
    languageOptions: baseLanguageOptions,
    plugins: {
      tjd: plugin,
    },
    rules: {
      'tjd/accurate-jsdoc': 'error',
      'tjd/no-redundant-jsdoc': 'warn',
    },
  },

  /**
   * Strict config for thorough JSDoc enforcement.
   * - All rules enabled as errors
   * - Requires complete JSDoc for exported functions
   *
   * Best for libraries and public APIs.
   * Includes JSX support.
   */
  strict: {
    name: 'typed-jsdoc/strict',
    files: jsFilePatterns,
    languageOptions: baseLanguageOptions,
    plugins: {
      tjd: plugin,
    },
    rules: {
      'tjd/accurate-jsdoc': 'error',
      'tjd/no-redundant-jsdoc': 'error',
      'tjd/no-implicit-any': 'error',
      'tjd/require-jsdoc-types': 'error',
    },
  },

  /**
   * Minimal config for just accuracy checking.
   * - Ensures JSDoc matches inference
   *
   * Good starting point for existing projects.
   * Includes JSX support.
   */
  minimal: {
    name: 'typed-jsdoc/minimal',
    files: jsFilePatterns,
    languageOptions: baseLanguageOptions,
    plugins: {
      tjd: plugin,
    },
    rules: {
      'tjd/accurate-jsdoc': 'error',
    },
  },

  /**
   * Rules-only config (no parser setup).
   * Use this if you already have TypeScript parser configured.
   * Provides just the plugin and recommended rules.
   */
  'rules-only': {
    name: 'typed-jsdoc/rules-only',
    plugins: {
      tjd: plugin,
    },
    rules: {
      'tjd/accurate-jsdoc': 'error',
      'tjd/no-redundant-jsdoc': 'warn',
    },
  },

  /**
   * Next.js preset - optimized for Next.js applications.
   * - Ignores .next/ build output and node_modules
   * - Covers pages/, app/, components/, lib/, etc.
   * - JSX enabled for React components
   *
   * Usage: tjd.configs.next (returns array, spread into your config)
   */
  get next() {
    return [
      {
        name: 'typed-jsdoc/next/ignores',
        ignores: ['.next/**', 'out/**', 'node_modules/**', 'coverage/**'],
      },
      {
        name: 'typed-jsdoc/next/rules',
        files: nextFilePatterns,
        languageOptions: baseLanguageOptions,
        plugins: {
          tjd: plugin,
        },
        rules: {
          'tjd/accurate-jsdoc': 'error',
          'tjd/no-redundant-jsdoc': 'warn',
        },
      },
    ];
  },

  /**
   * Ember.js preset - optimized for Ember applications.
   * - Ignores dist/, tmp/, and build artifacts
   * - Covers app/, addon/, tests/ directories
   * - Supports .gjs Glimmer component files
   *
   * Usage: tjd.configs.ember (returns array, spread into your config)
   */
  get ember() {
    return [
      {
        name: 'typed-jsdoc/ember/ignores',
        ignores: [
          'dist/**',
          'tmp/**',
          'node_modules/**',
          '.ember-cli/**',
          'coverage/**',
          'declarations/**',
          'blueprints/**',
        ],
      },
      {
        name: 'typed-jsdoc/ember/rules',
        files: emberFilePatterns,
        languageOptions: baseLanguageOptions,
        plugins: {
          tjd: plugin,
        },
        rules: {
          'tjd/accurate-jsdoc': 'error',
          'tjd/no-redundant-jsdoc': 'warn',
        },
      },
    ];
  },
});

export default plugin;
