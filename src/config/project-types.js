/**
 * Project type definitions with file patterns and rule modifiers.
 */

/**
 * @typedef {import('./types.js').ProjectType} ProjectType
 * @typedef {import('./types.js').ProjectTypeDefinition} ProjectTypeDefinition
 */

/**
 * Application project type.
 * Uses preset defaults with standard patterns.
 * @type {ProjectTypeDefinition}
 */
const app = {
  name: 'app',
  files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.jsx'],
  ignores: ['node_modules/**', 'coverage/**', 'dist/**', 'build/**'],
  rules: {},
};

/**
 * Library project type.
 * Stricter JSDoc requirements for public APIs.
 * @type {ProjectTypeDefinition}
 */
const library = {
  name: 'library',
  files: ['src/**/*.js', 'src/**/*.mjs', 'lib/**/*.js', 'lib/**/*.mjs'],
  ignores: ['node_modules/**', 'coverage/**', 'dist/**', 'build/**'],
  rules: {
    'require-jsdoc-types': 'error',
  },
};

/**
 * CLI project type.
 * Includes bin and commands directories.
 * @type {ProjectTypeDefinition}
 */
const cli = {
  name: 'cli',
  files: [
    'src/**/*.js',
    'src/**/*.mjs',
    'bin/**/*.js',
    'bin/**/*.mjs',
    'commands/**/*.js',
    'commands/**/*.mjs',
  ],
  ignores: ['node_modules/**', 'coverage/**', 'dist/**', 'build/**'],
  rules: {},
};

/**
 * Monorepo project type.
 * Targets package source directories.
 * @type {ProjectTypeDefinition}
 */
const monorepo = {
  name: 'monorepo',
  files: [
    'packages/*/src/**/*.js',
    'packages/*/src/**/*.mjs',
    'packages/*/lib/**/*.js',
    'packages/*/lib/**/*.mjs',
  ],
  ignores: ['node_modules/**', 'coverage/**', '**/dist/**', '**/build/**'],
  rules: {},
};

/**
 * Legacy project type.
 * Relaxed rules for gradual adoption.
 * @type {ProjectTypeDefinition}
 */
const legacy = {
  name: 'legacy',
  files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.jsx'],
  ignores: ['node_modules/**', 'coverage/**', 'dist/**', 'build/**'],
  rules: {
    'accurate-jsdoc': 'warn',
    'no-redundant-jsdoc': 'off',
    'no-implicit-any': 'off',
    'require-jsdoc-types': 'off',
  },
};

/**
 * Map of project type names to definitions.
 * @type {Record<ProjectType, ProjectTypeDefinition>}
 */
export const projectTypes = {
  app,
  library,
  cli,
  monorepo,
  legacy,
};

/**
 * Get project type definition by name.
 *
 * @param {ProjectType} name
 * @returns {ProjectTypeDefinition}
 */
export function getProjectType(name) {
  return projectTypes[name];
}
