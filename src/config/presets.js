/**
 * Preset definitions for rule strictness levels.
 */

/**
 * @typedef {import('./types.js').Preset} Preset
 * @typedef {import('./types.js').PresetDefinition} PresetDefinition
 * @typedef {import('./types.js').RuleOverrides} RuleOverrides
 */

/**
 * Recommended preset - balanced for most projects.
 * - accurate-jsdoc: error (core functionality)
 * - no-redundant-jsdoc: warn (clean up unnecessary types)
 * @type {PresetDefinition}
 */
const recommended = {
  name: 'recommended',
  rules: {
    'accurate-jsdoc': 'error',
    'no-redundant-jsdoc': 'warn',
    'no-implicit-any': 'off',
    'require-jsdoc-types': 'off',
  },
};

/**
 * Strict preset - both rules as errors.
 * @type {PresetDefinition}
 */
const strict = {
  name: 'strict',
  rules: {
    'accurate-jsdoc': 'error',
    'no-redundant-jsdoc': 'error',
    'no-implicit-any': 'off',
    'require-jsdoc-types': 'off',
  },
};

/**
 * Minimal preset - just accuracy checking.
 * Good starting point for existing projects.
 * @type {PresetDefinition}
 */
const minimal = {
  name: 'minimal',
  rules: {
    'accurate-jsdoc': 'error',
    'no-redundant-jsdoc': 'off',
    'no-implicit-any': 'off',
    'require-jsdoc-types': 'off',
  },
};

/**
 * Map of preset names to definitions.
 * @type {Record<Preset, PresetDefinition>}
 */
export const presets = {
  recommended,
  strict,
  minimal,
};

/**
 * Get rules for a preset.
 *
 * @param {Preset} preset
 * @returns {RuleOverrides}
 */
export function getPresetRules(preset) {
  return presets[preset].rules;
}
