/**
 * Type definitions for the config factory.
 *
 * @typedef {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config} FlatConfig
 */

/**
 * Preset strictness levels for rule configuration.
 * - recommended: balanced rules for most projects
 * - strict: all rules enabled as errors
 * - minimal: just accuracy and redundancy checking
 *
 * @typedef {'recommended' | 'strict' | 'minimal'} Preset
 */

/**
 * Supported frameworks with specialized configurations.
 *
 * @typedef {'next' | 'ember' | 'react' | 'vue' | 'svelte' | 'express' | 'fastify' | 'node'} Framework
 */

/**
 * Project types that affect file patterns and rule strictness.
 *
 * @typedef {'app' | 'library' | 'cli' | 'monorepo' | 'legacy'} ProjectType
 */

/**
 * Rule severity levels.
 *
 * @typedef {'off' | 'warn' | 'error'} RuleSeverity
 */

/**
 * Rule overrides for typed-jsdoc rules.
 *
 * @typedef {object} RuleOverrides
 * @property {RuleSeverity} [accurate-jsdoc]
 * @property {RuleSeverity} [no-redundant-jsdoc]
 * @property {RuleSeverity} [no-implicit-any]
 * @property {RuleSeverity} [require-jsdoc-types]
 */

/**
 * TypeScript configuration options.
 *
 * @typedef {object} TypeScriptOptions
 * @property {string | string[]} [project] - Path to tsconfig.json (alternative to projectService).
 *   Use this if projectService doesn't work for your setup.
 * @property {string} [tsconfigRootDir] - Root directory for resolving tsconfig paths.
 *   Typically set to import.meta.dirname in ESM.
 */

/**
 * Options for createConfig factory function.
 *
 * @typedef {object} CreateConfigOptions
 * @property {Preset} [preset] - Preset strictness level. Default: 'recommended'
 * @property {Framework} [framework] - Framework-specific configuration. Adds appropriate file patterns and ignores.
 * @property {ProjectType} [projectType] - Project type affects file patterns and rule modifiers. Default: 'app'
 * @property {TypeScriptOptions} [typescript] - TypeScript configuration.
 *   By default, uses projectService for zero-config support.
 * @property {string[]} [files] - Additional file patterns to include.
 *   Merged with framework/project type patterns.
 * @property {string[]} [ignores] - Additional patterns to ignore.
 *   Merged with framework/project type ignores.
 * @property {RuleOverrides} [rules] - Rule severity overrides.
 *   Applied after preset and project type modifiers.
 * @property {string[]} [ignorePatterns] - Function name patterns to ignore for all rules.
 *   Passed to rules that support ignorePatterns option.
 */

/**
 * Framework definition with file patterns and ignores.
 *
 * @typedef {object} FrameworkDefinition
 * @property {Framework} name - Framework name for config naming
 * @property {string[]} files - File patterns to lint
 * @property {string[]} ignores - Patterns to ignore
 * @property {boolean} jsx - Whether JSX parsing is needed
 */

/**
 * Project type definition with file patterns and rule modifiers.
 *
 * @typedef {object} ProjectTypeDefinition
 * @property {ProjectType} name - Project type name
 * @property {string[]} files - File patterns to lint
 * @property {string[]} ignores - Patterns to ignore
 * @property {RuleOverrides} rules - Rule severity modifiers
 */

/**
 * Preset definition with rule severities.
 *
 * @typedef {object} PresetDefinition
 * @property {Preset} name - Preset name
 * @property {RuleOverrides} rules - Rule severities
 */

/**
 * Array of ESLint flat config objects.
 *
 * @typedef {FlatConfig[]} FlatConfigArray
 */

// Export empty object to make this a module
export {};
