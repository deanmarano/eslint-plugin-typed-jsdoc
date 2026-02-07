import { RuleTester } from '@typescript-eslint/rule-tester';
import { describe, it, afterAll } from 'vitest';
import * as path from 'path';
import { fileURLToPath } from 'url';
import noRedundantJsdoc from '../../src/rules/no-redundant-jsdoc.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.ts', '*.js'],
        defaultProject: path.join(__dirname, '../fixtures/tsconfig.json'),
      },
      tsconfigRootDir: path.join(__dirname, '../fixtures'),
    },
  },
});

ruleTester.run('no-redundant-jsdoc', noRedundantJsdoc, {
  valid: [
    // JSDoc adds information (widens literal to string)
    {
      code: `/** @type {string} */ const x = "hello";`,
    },
    // JSDoc adds nullable
    {
      code: `/** @type {string | null} */ const x = null;`,
    },
    // No JSDoc
    {
      code: `const x = String(42);`,
    },
  ],
  invalid: [
    // String() returns string, so @type {string} is redundant
    {
      code: `/** @type {string} */ const x = String(42);`,
      output: `const x = String(42);`,
      errors: [{ messageId: 'redundantJsdoc' }],
    },
    // parseInt returns number, so @type {number} is redundant
    {
      code: `/** @type {number} */ const x = parseInt("42", 10);`,
      output: `const x = parseInt("42", 10);`,
      errors: [{ messageId: 'redundantJsdoc' }],
    },
    // Same test but for JavaScript files
    {
      code: `/** @type {string} */ const x = String(42);`,
      output: `const x = String(42);`,
      errors: [{ messageId: 'redundantJsdoc' }],
      filename: 'test.js',
    },
  ],
});
