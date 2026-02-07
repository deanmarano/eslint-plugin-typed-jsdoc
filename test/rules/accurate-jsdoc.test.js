import { RuleTester } from '@typescript-eslint/rule-tester';
import { describe, it, afterAll } from 'vitest';
import * as path from 'path';
import { fileURLToPath } from 'url';
import accurateJsdoc from '../../src/rules/accurate-jsdoc.js';

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

ruleTester.run('accurate-jsdoc', accurateJsdoc, {
  valid: [
    // Correct JSDoc type matches TypeScript annotation
    {
      code: `
/** @param {number} x */
function double(x) {
  return x * 2;
}
      `,
    },
    // No JSDoc - nothing to check
    {
      code: `
function add(a, b) {
  return a + b;
}
      `,
    },
    // JSDoc with any inferred - JSDoc is providing info, not contradicting
    {
      code: `
/** @param {number} x */
function process(x) {
  return x;
}
      `,
    },
  ],
  invalid: [
    // Mismatched return type - JSDoc says string but function returns number
    {
      code: `
/**
 * @returns {string}
 */
function getValue() {
  return 42;
}
      `,
      output: `
/**
 * @returns {number}
 */
function getValue() {
  return 42;
}
      `,
      errors: [{ messageId: 'returnsMismatch' }],
    },
  ],
});
