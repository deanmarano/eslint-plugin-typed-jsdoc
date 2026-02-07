import { describe, it, expect } from 'vitest';
import {
  normalizeTypeString,
  typesMatch,
  isTypeInteresting,
  tsTypeToJSDoc,
  getTypeShape,
} from '../../src/utils/type-comparison.js';

describe('normalizeTypeString', () => {
  it('normalizes Array<T> to T[]', () => {
    expect(normalizeTypeString('Array<string>')).toBe('string[]');
    expect(normalizeTypeString('Array<number>')).toBe('number[]');
  });

  it('normalizes nested arrays', () => {
    expect(normalizeTypeString('Array<Array<string>>')).toBe('string[][]');
  });

  it('normalizes wrapper types to primitives', () => {
    expect(normalizeTypeString('String')).toBe('string');
    expect(normalizeTypeString('Number')).toBe('number');
    expect(normalizeTypeString('Boolean')).toBe('boolean');
    expect(normalizeTypeString('Object')).toBe('object');
  });

  it('removes extra whitespace', () => {
    expect(normalizeTypeString('  string  |  number  ')).toBe('string | number');
  });

  it('normalizes whitespace around operators', () => {
    expect(normalizeTypeString('string|number')).toBe('string | number');
    expect(normalizeTypeString('string  |  number')).toBe('string | number');
    expect(normalizeTypeString('A&B')).toBe('A & B');
  });

  it('removes outer parentheses', () => {
    expect(normalizeTypeString('(string)')).toBe('string');
    expect(normalizeTypeString('(string | number)')).toBe('string | number');
  });

  it('preserves necessary parentheses', () => {
    expect(normalizeTypeString('(string | number)[]')).toBe('(string | number)[]');
  });
});

describe('typesMatch', () => {
  describe('direct matches', () => {
    it('matches identical types', () => {
      expect(typesMatch('string', 'string')).toBe(true);
      expect(typesMatch('number', 'number')).toBe(true);
    });

    it('matches normalized types', () => {
      expect(typesMatch('String', 'string')).toBe(true);
      expect(typesMatch('Array<string>', 'string[]')).toBe(true);
    });
  });

  describe('JSDoc special syntax', () => {
    it('handles JSDoc wildcards', () => {
      expect(typesMatch('*', 'any')).toBe(true);
      expect(typesMatch('*', 'unknown')).toBe(true);
    });

    it('handles JSDoc nullable', () => {
      expect(typesMatch('?string', 'string | null')).toBe(true);
      expect(typesMatch('?string', 'null | string')).toBe(true);
      expect(typesMatch('?string', 'string | undefined')).toBe(true);
    });

    it('handles JSDoc non-nullable', () => {
      expect(typesMatch('!string', 'string')).toBe(true);
    });
  });

  describe('union types', () => {
    it('matches unions with same order', () => {
      expect(typesMatch('string | number', 'string | number')).toBe(true);
    });

    it('matches unions with different order', () => {
      expect(typesMatch('string | number', 'number | string')).toBe(true);
      expect(typesMatch('A | B | C', 'C | A | B')).toBe(true);
    });

    it('handles whitespace differences in unions', () => {
      expect(typesMatch('string|number', 'string | number')).toBe(true);
    });
  });

  describe('void and undefined', () => {
    it('treats void and undefined as equivalent', () => {
      expect(typesMatch('void', 'undefined')).toBe(true);
      expect(typesMatch('undefined', 'void')).toBe(true);
    });

    it('handles Promise<void> vs Promise<undefined>', () => {
      expect(typesMatch('Promise<void>', 'Promise<undefined>')).toBe(true);
    });
  });

  describe('function types', () => {
    it('matches function syntax to arrow type', () => {
      expect(typesMatch('function(string): number', '(x: string) => number')).toBe(true);
      expect(typesMatch('Function', '() => void')).toBe(true);
    });
  });

  describe('array types', () => {
    it('matches unparameterized Array to any[]', () => {
      expect(typesMatch('Array', 'any[]')).toBe(true);
      expect(typesMatch('any[]', 'Array')).toBe(true);
    });

    it('matches Array<T> to T[]', () => {
      expect(typesMatch('Array<string>', 'string[]')).toBe(true);
    });
  });

  describe('qualified names', () => {
    it('matches fs.Stats to Stats', () => {
      expect(typesMatch('fs.Stats', 'Stats')).toBe(true);
      expect(typesMatch('Stats', 'fs.Stats')).toBe(true);
    });

    it('matches http.IncomingMessage to IncomingMessage', () => {
      expect(typesMatch('http.IncomingMessage', 'IncomingMessage')).toBe(true);
    });
  });

  describe('mismatches', () => {
    it('returns false for mismatched types', () => {
      expect(typesMatch('string', 'number')).toBe(false);
      expect(typesMatch('string[]', 'number[]')).toBe(false);
    });

    it('returns false for different union lengths', () => {
      expect(typesMatch('string | number', 'string | number | boolean')).toBe(false);
    });
  });
});

describe('isTypeInteresting', () => {
  it('considers primitives not interesting', () => {
    expect(isTypeInteresting('string')).toBe(false);
    expect(isTypeInteresting('number')).toBe(false);
    expect(isTypeInteresting('boolean')).toBe(false);
    expect(isTypeInteresting('void')).toBe(false);
  });

  it('considers literal types not interesting', () => {
    expect(isTypeInteresting('"hello"')).toBe(false);
    expect(isTypeInteresting("'world'")).toBe(false);
    expect(isTypeInteresting('42')).toBe(false);
    expect(isTypeInteresting('-3.14')).toBe(false);
  });

  it('considers complex types interesting', () => {
    expect(isTypeInteresting('string[]')).toBe(true);
    expect(isTypeInteresting('{ name: string }')).toBe(true);
    expect(isTypeInteresting('Promise<string>')).toBe(true);
    expect(isTypeInteresting('string | number')).toBe(true);
  });
});

describe('tsTypeToJSDoc', () => {
  it('converts arrow function to JSDoc function', () => {
    expect(tsTypeToJSDoc('(a: string) => number')).toBe('function(string): number');
    expect(tsTypeToJSDoc('(a: string, b: number) => boolean')).toBe('function(string, number): boolean');
  });

  it('handles parameterless functions', () => {
    expect(tsTypeToJSDoc('() => void')).toBe('function(): void');
  });

  it('preserves non-function types', () => {
    expect(tsTypeToJSDoc('string')).toBe('string');
    expect(tsTypeToJSDoc('string[]')).toBe('string[]');
  });
});

describe('getTypeShape', () => {
  it('identifies primitives', () => {
    expect(getTypeShape('string')).toBe('primitive');
    expect(getTypeShape('number')).toBe('primitive');
    expect(getTypeShape('boolean')).toBe('primitive');
    expect(getTypeShape('void')).toBe('primitive');
  });

  it('identifies arrays', () => {
    expect(getTypeShape('string[]')).toBe('array');
    expect(getTypeShape('number[]')).toBe('array');
  });

  it('identifies unions', () => {
    expect(getTypeShape('string | number')).toBe('union');
  });

  it('identifies functions', () => {
    expect(getTypeShape('() => void')).toBe('function');
    expect(getTypeShape('function(string): number')).toBe('function');
  });

  it('identifies objects', () => {
    expect(getTypeShape('{ name: string }')).toBe('object');
  });

  it('identifies generics', () => {
    expect(getTypeShape('Promise<string>')).toBe('generic');
    expect(getTypeShape('Map<string, number>')).toBe('generic');
  });
});
