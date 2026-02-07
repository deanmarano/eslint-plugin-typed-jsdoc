import { describe, it, expect } from 'vitest';
import {
  parseJSDoc,
  getJSDocParamType,
  getJSDocReturnsType,
  getJSDocType,
  generateJSDoc,
  updateTagType,
  removeTag,
  addTag,
} from '../../src/utils/jsdoc.js';

describe('parseJSDoc', () => {
  it('parses simple param tag', () => {
    const result = parseJSDoc(`*
 * @param {string} name The name
 `);
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0]).toEqual({
      tag: 'param',
      type: 'string',
      name: 'name',
      description: 'The name',
      optional: undefined,
      defaultValue: undefined,
    });
  });

  it('parses optional param with brackets', () => {
    const result = parseJSDoc(`*
 * @param {string} [name] Optional name
 `);
    expect(result.tags[0]).toMatchObject({
      tag: 'param',
      type: 'string',
      name: 'name',
      optional: true,
    });
  });

  it('parses optional param with default value', () => {
    const result = parseJSDoc(`*
 * @param {string} [name="default"] Name with default
 `);
    expect(result.tags[0]).toMatchObject({
      tag: 'param',
      type: 'string',
      name: 'name',
      optional: true,
      defaultValue: '"default"',
    });
  });

  it('parses nested object types', () => {
    const result = parseJSDoc(`*
 * @param {{name: string, age: number}} person A person object
 `);
    expect(result.tags[0]).toMatchObject({
      tag: 'param',
      type: '{name: string, age: number}',
      name: 'person',
    });
  });

  it('parses complex generic types', () => {
    const result = parseJSDoc(`*
 * @param {Map<string, Array<number>>} data Complex map
 `);
    expect(result.tags[0]).toMatchObject({
      tag: 'param',
      type: 'Map<string, Array<number>>',
      name: 'data',
    });
  });

  it('parses function types', () => {
    const result = parseJSDoc(`*
 * @param {function(string): number} fn Callback function
 `);
    expect(result.tags[0]).toMatchObject({
      tag: 'param',
      type: 'function(string): number',
      name: 'fn',
    });
  });

  it('parses @returns tag', () => {
    const result = parseJSDoc(`*
 * @returns {Promise<string>} The result
 `);
    expect(result.tags[0]).toMatchObject({
      tag: 'returns',
      type: 'Promise<string>',
      description: 'The result',
    });
  });

  it('parses @type tag', () => {
    const result = parseJSDoc(`*
 * @type {string}
 `);
    expect(result.tags[0]).toMatchObject({
      tag: 'type',
      type: 'string',
    });
  });

  it('parses description', () => {
    const result = parseJSDoc(`*
 * This is a description.
 * It spans multiple lines.
 *
 * @param {string} name
 `);
    expect(result.description).toBe('This is a description. It spans multiple lines.');
  });

  it('parses multiple tags', () => {
    const result = parseJSDoc(`*
 * Adds two numbers.
 * @param {number} a First number
 * @param {number} b Second number
 * @returns {number} The sum
 `);
    expect(result.description).toBe('Adds two numbers.');
    expect(result.tags).toHaveLength(3);
  });

  it('parses dotted param names', () => {
    const result = parseJSDoc(`*
 * @param {Object} options
 * @param {string} options.name
 * @param {number} options.timeout
 `);
    expect(result.tags).toHaveLength(3);
    expect(result.tags[1].name).toBe('options.name');
    expect(result.tags[2].name).toBe('options.timeout');
  });
});

describe('getJSDocParamType', () => {
  it('gets param type by name', () => {
    const jsdoc = parseJSDoc(`*
 * @param {string} name
 * @param {number} age
 `);
    expect(getJSDocParamType(jsdoc, 'name')).toBe('string');
    expect(getJSDocParamType(jsdoc, 'age')).toBe('number');
    expect(getJSDocParamType(jsdoc, 'unknown')).toBeUndefined();
  });
});

describe('getJSDocReturnsType', () => {
  it('gets returns type', () => {
    const jsdoc = parseJSDoc(`*
 * @returns {string}
 `);
    expect(getJSDocReturnsType(jsdoc)).toBe('string');
  });

  it('handles @return alias', () => {
    const jsdoc = parseJSDoc(`*
 * @return {number}
 `);
    expect(getJSDocReturnsType(jsdoc)).toBe('number');
  });
});

describe('getJSDocType', () => {
  it('gets type annotation', () => {
    const jsdoc = parseJSDoc(`*
 * @type {string[]}
 `);
    expect(getJSDocType(jsdoc)).toBe('string[]');
  });
});

describe('generateJSDoc', () => {
  it('generates simple JSDoc', () => {
    const result = generateJSDoc({
      tags: [{ tag: 'param', type: 'string', name: 'name' }],
    });
    expect(result).toBe(`/**
 * @param {string} name
 */`);
  });

  it('generates JSDoc with description', () => {
    const result = generateJSDoc({
      description: 'A function.',
      tags: [{ tag: 'param', type: 'string', name: 'x' }],
    });
    expect(result).toContain('A function.');
    expect(result).toContain('@param {string} x');
  });

  it('generates optional params', () => {
    const result = generateJSDoc({
      tags: [{ tag: 'param', type: 'string', name: 'name', optional: true }],
    });
    expect(result).toContain('@param {string} [name]');
  });

  it('generates optional params with defaults', () => {
    const result = generateJSDoc({
      tags: [{ tag: 'param', type: 'string', name: 'name', optional: true, defaultValue: '"test"' }],
    });
    expect(result).toContain('@param {string} [name="test"]');
  });

  it('handles indentation', () => {
    const result = generateJSDoc(
      {
        tags: [{ tag: 'type', type: 'string' }],
      },
      '  '
    );
    expect(result).toBe(`  /**
   * @type {string}
   */`);
  });
});

describe('updateTagType', () => {
  it('updates param type', () => {
    const jsdoc = parseJSDoc(`*
 * @param {string} name
 `);
    const result = updateTagType(jsdoc, 'param', 'name', 'number');
    expect(result).toContain('@param {number} name');
  });

  it('updates returns type', () => {
    const jsdoc = parseJSDoc(`*
 * @returns {string}
 `);
    const result = updateTagType(jsdoc, 'returns', undefined, 'number');
    expect(result).toContain('@returns {number}');
  });
});

describe('removeTag', () => {
  it('removes a tag', () => {
    const jsdoc = parseJSDoc(`*
 * Description
 * @param {string} name
 * @returns {void}
 `);
    const result = removeTag(jsdoc, 'param', 'name');
    expect(result).not.toContain('@param');
    expect(result).toContain('@returns');
    expect(result).toContain('Description');
  });

  it('returns undefined for empty JSDoc', () => {
    const jsdoc = parseJSDoc(`*
 * @type {string}
 `);
    const result = removeTag(jsdoc, 'type');
    expect(result).toBeUndefined();
  });
});

describe('addTag', () => {
  it('adds tag to existing JSDoc', () => {
    const jsdoc = parseJSDoc(`*
 * @param {string} a
 `);
    const result = addTag(jsdoc, { tag: 'param', type: 'number', name: 'b' });
    expect(result).toContain('@param {string} a');
    expect(result).toContain('@param {number} b');
  });

  it('creates new JSDoc if none exists', () => {
    const result = addTag(undefined, { tag: 'type', type: 'string' });
    expect(result).toContain('@type {string}');
  });
});
