/**
 * Framework definitions with file patterns and ignores.
 */

/**
 * @typedef {import('./types.js').Framework} Framework
 * @typedef {import('./types.js').FrameworkDefinition} FrameworkDefinition
 */

/**
 * Next.js framework configuration.
 * @type {FrameworkDefinition}
 */
const next = {
  name: 'next',
  files: ['**/*.js', '**/*.mjs', '**/*.jsx'],
  ignores: ['.next/**', 'out/**', 'node_modules/**', 'coverage/**'],
  jsx: true,
};

/**
 * Ember.js framework configuration.
 * Includes support for .gjs Glimmer component files.
 * @type {FrameworkDefinition}
 */
const ember = {
  name: 'ember',
  files: ['**/*.js', '**/*.mjs', '**/*.gjs'],
  ignores: [
    'dist/**',
    'tmp/**',
    'node_modules/**',
    '.ember-cli/**',
    'coverage/**',
    'declarations/**',
    'blueprints/**',
  ],
  jsx: false,
};

/**
 * React framework configuration.
 * @type {FrameworkDefinition}
 */
const react = {
  name: 'react',
  files: ['**/*.js', '**/*.mjs', '**/*.jsx'],
  ignores: ['build/**', 'dist/**', 'node_modules/**', 'coverage/**'],
  jsx: true,
};

/**
 * Vue framework configuration.
 * @type {FrameworkDefinition}
 */
const vue = {
  name: 'vue',
  files: ['**/*.js', '**/*.mjs', '**/*.vue'],
  ignores: ['dist/**', '.nuxt/**', 'node_modules/**', 'coverage/**'],
  jsx: false,
};

/**
 * Svelte framework configuration.
 * @type {FrameworkDefinition}
 */
const svelte = {
  name: 'svelte',
  files: ['**/*.js', '**/*.mjs', '**/*.svelte'],
  ignores: ['.svelte-kit/**', 'build/**', 'node_modules/**', 'coverage/**'],
  jsx: false,
};

/**
 * Express framework configuration.
 * @type {FrameworkDefinition}
 */
const express = {
  name: 'express',
  files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
  ignores: ['public/**', 'node_modules/**', 'coverage/**'],
  jsx: false,
};

/**
 * Fastify framework configuration.
 * @type {FrameworkDefinition}
 */
const fastify = {
  name: 'fastify',
  files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
  ignores: ['node_modules/**', 'coverage/**'],
  jsx: false,
};

/**
 * Node.js (generic) framework configuration.
 * @type {FrameworkDefinition}
 */
const node = {
  name: 'node',
  files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
  ignores: ['node_modules/**', 'coverage/**'],
  jsx: false,
};

/**
 * Map of framework names to definitions.
 * @type {Record<Framework, FrameworkDefinition>}
 */
export const frameworks = {
  next,
  ember,
  react,
  vue,
  svelte,
  express,
  fastify,
  node,
};

/**
 * Get framework definition by name.
 *
 * @param {Framework} name
 * @returns {FrameworkDefinition}
 */
export function getFramework(name) {
  return frameworks[name];
}
