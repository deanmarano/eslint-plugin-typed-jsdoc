import { describe, it, expect } from 'vitest';
import plugin from '../../src/index.js';

describe('createConfig', () => {
  describe('default options', () => {
    it('returns an array of configs', () => {
      const configs = plugin.createConfig();
      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThanOrEqual(1);
    });

    it('uses recommended preset by default', () => {
      const configs = plugin.createConfig();
      const rulesConfig = configs.find((c) => c.rules);
      expect(rulesConfig?.rules).toHaveProperty('tjd/accurate-jsdoc');
      expect(rulesConfig?.rules?.['tjd/accurate-jsdoc']).toBe('error');
      expect(rulesConfig?.rules?.['tjd/no-redundant-jsdoc']).toBe('warn');
      // no-implicit-any is off by default
      expect(rulesConfig?.rules?.['tjd/no-implicit-any']).toBeUndefined();
    });

    it('includes tjd plugin', () => {
      const configs = plugin.createConfig();
      const rulesConfig = configs.find((c) => c.plugins);
      expect(rulesConfig?.plugins).toHaveProperty('tjd');
    });

    it('includes parser configuration', () => {
      const configs = plugin.createConfig();
      const rulesConfig = configs.find((c) => c.languageOptions);
      expect(rulesConfig?.languageOptions?.parser).toBeDefined();
      expect(rulesConfig?.languageOptions?.parserOptions?.projectService).toBe(true);
    });
  });

  describe('presets', () => {
    it('applies strict preset rules', () => {
      const configs = plugin.createConfig({ preset: 'strict' });
      const rulesConfig = configs.find((c) => c.rules);
      expect(rulesConfig?.rules?.['tjd/accurate-jsdoc']).toBe('error');
      expect(rulesConfig?.rules?.['tjd/no-redundant-jsdoc']).toBe('error');
      expect(rulesConfig?.rules?.['tjd/no-implicit-any']).toBeUndefined();
      expect(rulesConfig?.rules?.['tjd/require-jsdoc-types']).toBeUndefined();
    });

    it('applies minimal preset rules', () => {
      const configs = plugin.createConfig({ preset: 'minimal' });
      const rulesConfig = configs.find((c) => c.rules);
      expect(rulesConfig?.rules?.['tjd/accurate-jsdoc']).toBe('error');
      expect(rulesConfig?.rules?.['tjd/no-redundant-jsdoc']).toBeUndefined();
      expect(rulesConfig?.rules?.['tjd/no-implicit-any']).toBeUndefined();
    });
  });

  describe('frameworks', () => {
    it('applies Next.js framework config', () => {
      const configs = plugin.createConfig({ framework: 'next' });

      const ignoresConfig = configs.find((c) => c.ignores && !c.rules);
      expect(ignoresConfig?.ignores).toContain('.next/**');
      expect(ignoresConfig?.ignores).toContain('out/**');

      const rulesConfig = configs.find((c) => c.files);
      expect(rulesConfig?.files).toContain('**/*.jsx');
    });

    it('applies Ember framework config', () => {
      const configs = plugin.createConfig({ framework: 'ember' });

      const ignoresConfig = configs.find((c) => c.ignores && !c.rules);
      expect(ignoresConfig?.ignores).toContain('dist/**');
      expect(ignoresConfig?.ignores).toContain('.ember-cli/**');

      const rulesConfig = configs.find((c) => c.files);
      expect(rulesConfig?.files).toContain('**/*.gjs');
    });

    it('applies React framework config', () => {
      const configs = plugin.createConfig({ framework: 'react' });

      const ignoresConfig = configs.find((c) => c.ignores && !c.rules);
      expect(ignoresConfig?.ignores).toContain('build/**');

      const rulesConfig = configs.find((c) => c.files);
      expect(rulesConfig?.files).toContain('**/*.jsx');
    });

    it('applies Vue framework config', () => {
      const configs = plugin.createConfig({ framework: 'vue' });

      const ignoresConfig = configs.find((c) => c.ignores && !c.rules);
      expect(ignoresConfig?.ignores).toContain('.nuxt/**');

      const rulesConfig = configs.find((c) => c.files);
      expect(rulesConfig?.files).toContain('**/*.vue');
    });

    it('applies Svelte framework config', () => {
      const configs = plugin.createConfig({ framework: 'svelte' });

      const ignoresConfig = configs.find((c) => c.ignores && !c.rules);
      expect(ignoresConfig?.ignores).toContain('.svelte-kit/**');

      const rulesConfig = configs.find((c) => c.files);
      expect(rulesConfig?.files).toContain('**/*.svelte');
    });

    it('applies Express framework config', () => {
      const configs = plugin.createConfig({ framework: 'express' });

      const ignoresConfig = configs.find((c) => c.ignores && !c.rules);
      expect(ignoresConfig?.ignores).toContain('public/**');
    });

    it('applies Fastify framework config', () => {
      const configs = plugin.createConfig({ framework: 'fastify' });
      const rulesConfig = configs.find((c) => c.files);
      expect(rulesConfig?.files).toContain('**/*.cjs');
    });

    it('applies Node framework config', () => {
      const configs = plugin.createConfig({ framework: 'node' });
      const rulesConfig = configs.find((c) => c.files);
      expect(rulesConfig?.files).toContain('**/*.mjs');
      expect(rulesConfig?.files).toContain('**/*.cjs');
    });
  });

  describe('project types', () => {
    it('applies library project type', () => {
      const configs = plugin.createConfig({ projectType: 'library' });
      const rulesConfig = configs.find((c) => c.rules);
      expect(rulesConfig?.rules?.['tjd/require-jsdoc-types']).toBe('error');
      expect(rulesConfig?.files).toContain('src/**/*.js');
      expect(rulesConfig?.files).toContain('lib/**/*.js');
    });

    it('applies cli project type', () => {
      const configs = plugin.createConfig({ projectType: 'cli' });
      const rulesConfig = configs.find((c) => c.files);
      expect(rulesConfig?.files).toContain('bin/**/*.js');
      expect(rulesConfig?.files).toContain('commands/**/*.js');
    });

    it('applies monorepo project type', () => {
      const configs = plugin.createConfig({ projectType: 'monorepo' });
      const rulesConfig = configs.find((c) => c.files);
      expect(rulesConfig?.files).toContain('packages/*/src/**/*.js');
    });

    it('applies legacy project type with relaxed rules', () => {
      const configs = plugin.createConfig({ projectType: 'legacy' });
      const rulesConfig = configs.find((c) => c.rules);
      expect(rulesConfig?.rules?.['tjd/accurate-jsdoc']).toBe('warn');
      expect(rulesConfig?.rules?.['tjd/no-implicit-any']).toBeUndefined();
    });
  });

  describe('typescript options', () => {
    it('uses custom tsconfig path', () => {
      const configs = plugin.createConfig({
        typescript: {
          project: './tsconfig.custom.json',
        },
      });
      const rulesConfig = configs.find((c) => c.languageOptions);
      expect(rulesConfig?.languageOptions?.parserOptions?.project).toBe('./tsconfig.custom.json');
      expect(rulesConfig?.languageOptions?.parserOptions?.projectService).toBeUndefined();
    });

    it('uses tsconfigRootDir', () => {
      const configs = plugin.createConfig({
        typescript: {
          project: './tsconfig.json',
          tsconfigRootDir: '/path/to/root',
        },
      });
      const rulesConfig = configs.find((c) => c.languageOptions);
      expect(rulesConfig?.languageOptions?.parserOptions?.tsconfigRootDir).toBe('/path/to/root');
    });
  });

  describe('file patterns', () => {
    it('merges custom files with project type files', () => {
      const configs = plugin.createConfig({
        files: ['custom/**/*.js'],
      });
      const rulesConfig = configs.find((c) => c.files);
      expect(rulesConfig?.files).toContain('custom/**/*.js');
      expect(rulesConfig?.files).toContain('**/*.js');
    });

    it('merges custom ignores with project type ignores', () => {
      const configs = plugin.createConfig({
        ignores: ['custom-ignore/**'],
      });
      const ignoresConfig = configs.find((c) => c.ignores);
      expect(ignoresConfig?.ignores).toContain('custom-ignore/**');
      expect(ignoresConfig?.ignores).toContain('node_modules/**');
    });
  });

  describe('rule overrides', () => {
    it('allows overriding preset rules', () => {
      const configs = plugin.createConfig({
        preset: 'strict',
        rules: {
          'accurate-jsdoc': 'warn',
        },
      });
      const rulesConfig = configs.find((c) => c.rules);
      expect(rulesConfig?.rules?.['tjd/accurate-jsdoc']).toBe('warn');
    });

    it('allows disabling rules', () => {
      const configs = plugin.createConfig({
        preset: 'strict',
        rules: {
          'require-jsdoc-types': 'off',
        },
      });
      const rulesConfig = configs.find((c) => c.rules);
      expect(rulesConfig?.rules?.['tjd/require-jsdoc-types']).toBeUndefined();
    });
  });

  describe('ignorePatterns', () => {
    it('passes ignorePatterns to rules', () => {
      const configs = plugin.createConfig({
        ignorePatterns: ['_*', 'internal*'],
      });
      const rulesConfig = configs.find((c) => c.rules);
      const accurateRule = rulesConfig?.rules?.['tjd/accurate-jsdoc'];
      expect(Array.isArray(accurateRule)).toBe(true);
      if (Array.isArray(accurateRule)) {
        expect(accurateRule[1]).toEqual({ ignorePatterns: ['_*', 'internal*'] });
      }
    });
  });

  describe('combination scenarios', () => {
    it('combines preset, framework, and project type', () => {
      const configs = plugin.createConfig({
        preset: 'strict',
        framework: 'next',
        projectType: 'library',
      });

      const ignoresConfig = configs.find((c) => c.ignores && !c.rules);
      expect(ignoresConfig?.ignores).toContain('.next/**');

      const rulesConfig = configs.find((c) => c.rules);
      expect(rulesConfig?.files).toContain('src/**/*.js');
      expect(rulesConfig?.files).toContain('**/*.jsx');
      expect(rulesConfig?.rules?.['tjd/require-jsdoc-types']).toBe('error');
    });
  });
});

describe('ejectConfig', () => {
  it('returns a string', () => {
    const result = plugin.ejectConfig();
    expect(typeof result).toBe('string');
  });

  it('includes necessary imports', () => {
    const result = plugin.ejectConfig();
    expect(result).toContain("import tjd from 'eslint-plugin-typed-jsdoc'");
    expect(result).toContain("import tsparser from '@typescript-eslint/parser'");
  });

  it('includes export default', () => {
    const result = plugin.ejectConfig();
    expect(result).toContain('export default [');
  });

  it('includes rules based on preset', () => {
    const result = plugin.ejectConfig({ preset: 'strict' });
    expect(result).toContain("'tjd/accurate-jsdoc'");
    expect(result).toContain("'tjd/no-redundant-jsdoc'");
  });

  it('includes framework ignores', () => {
    const result = plugin.ejectConfig({ framework: 'next' });
    expect(result).toContain('.next/**');
    expect(result).toContain('out/**');
  });

  it('includes custom tsconfig path', () => {
    const result = plugin.ejectConfig({
      typescript: {
        project: './tsconfig.custom.json',
      },
    });
    expect(result).toContain('project: "./tsconfig.custom.json"');
    expect(result).not.toContain('projectService');
  });

  it('includes ignorePatterns in rules', () => {
    const result = plugin.ejectConfig({
      ignorePatterns: ['_*'],
    });
    expect(result).toContain('ignorePatterns');
    expect(result).toContain('_*');
  });
});
