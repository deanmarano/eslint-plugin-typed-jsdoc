import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import estl from '../../dist/index.js';

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      estl,
    },
    rules: {
      'estl/accurate-jsdoc': 'error',
      'estl/no-redundant-jsdoc': 'warn',
      'estl/no-implicit-any': 'warn',
      'estl/require-jsdoc-types': 'warn',
    },
  },
];
