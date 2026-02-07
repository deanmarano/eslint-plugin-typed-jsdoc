/**
 * Type comparison utilities for comparing JSDoc types to TypeScript inferred types.
 */

/**
 * Normalize a type string for comparison.
 * Handles common equivalences like `Array<T>` vs `T[]`.
 *
 * @param {string} type
 * @returns {string}
 */
export function normalizeTypeString(type) {
  let normalized = type.trim();

  // Remove outer parentheses if they wrap the whole type
  if (normalized.startsWith('(') && normalized.endsWith(')')) {
    const inner = normalized.slice(1, -1);
    // Only remove if balanced
    if (isBalanced(inner)) {
      normalized = inner;
    }
  }

  // Normalize Object<K, V> to { [x: K]: V } BEFORE normalizing Object to object
  normalized = normalizeObjectSyntax(normalized);

  // Normalize wrapper types to primitives
  normalized = normalized.replace(/\bObject\b(?!\.)/g, 'object');
  normalized = normalized.replace(/\bBoolean\b/g, 'boolean');
  normalized = normalized.replace(/\bNumber\b/g, 'number');
  normalized = normalized.replace(/\bString\b/g, 'string');
  normalized = normalized.replace(/\bVoid\b/g, 'void');

  // Normalize Array<T> to T[] (handle nested generics)
  normalized = normalizeArraySyntax(normalized);

  // Normalize quote styles (single to double quotes for literals)
  normalized = normalizeQuotes(normalized);

  // Normalize whitespace around operators
  normalized = normalized.replace(/\s*\|\s*/g, ' | ');
  normalized = normalized.replace(/\s*&\s*/g, ' & ');
  normalized = normalized.replace(/\s*,\s*/g, ', ');
  normalized = normalized.replace(/\s*:\s*/g, ': ');
  normalized = normalized.replace(/\s*=>\s*/g, ' => ');

  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Check if parentheses/brackets are balanced in a string.
 *
 * @param {string} str
 * @returns {boolean}
 */
function isBalanced(str) {
  let depth = 0;
  for (const char of str) {
    if (char === '(' || char === '<' || char === '[' || char === '{') depth++;
    if (char === ')' || char === '>' || char === ']' || char === '}') depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

/**
 * Normalize Array<T> to T[] syntax, handling nested generics.
 *
 * @param {string} type
 * @returns {string}
 */
function normalizeArraySyntax(type) {
  // Find Array<...> patterns and convert to ...[]
  let result = type;
  let changed = true;

  // Keep converting until no more changes (for nested arrays)
  while (changed) {
    changed = false;
    const arrayMatch = result.match(/Array<([^<>]+)>/);
    if (arrayMatch) {
      let inner = arrayMatch[1];
      // Handle Array<*> as any[]
      if (inner === '*') {
        inner = 'any';
      }
      // Wrap in parens if it's a union type
      const wrapped = inner.includes('|') ? `(${inner})` : inner;
      result = result.replace(`Array<${arrayMatch[1]}>`, `${wrapped}[]`);
      changed = true;
    }
  }

  return result;
}

/**
 * Normalize Object<K, V> to { [x: K]: V } syntax.
 *
 * @param {string} type
 * @returns {string}
 */
function normalizeObjectSyntax(type) {
  // Object<string, any> -> { [x: string]: any }
  // Also handle when it's part of a union
  let result = type;

  // Handle Object<K, V> anywhere in the type
  result = result.replace(/Object<([^,<>]+),\s*([^<>]+)>/g, (_, k, v) => {
    return `{ [x: ${k.trim()}]: ${v.trim()}; }`;
  });

  return result;
}

/**
 * Normalize quote styles in literal types.
 * TypeScript uses double quotes, JSDoc often uses single quotes.
 *
 * @param {string} type
 * @returns {string}
 */
function normalizeQuotes(type) {
  // Convert single-quoted literals to double-quoted
  return type.replace(/'([^']+)'/g, '"$1"');
}

/**
 * Parse a union type into its constituent parts.
 *
 * @param {string} type
 * @returns {string[]}
 */
function parseUnionParts(type) {
  const parts = [];
  let current = '';
  let depth = 0;

  for (const char of type) {
    if (char === '<' || char === '(' || char === '[' || char === '{') {
      depth++;
      current += char;
    } else if (char === '>' || char === ')' || char === ']' || char === '}') {
      depth--;
      current += char;
    } else if (char === '|' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

/**
 * Compare two type strings for semantic equivalence.
 *
 * @param {string} jsdocType
 * @param {string} inferredType
 * @returns {boolean}
 */
export function typesMatch(jsdocType, inferredType) {
  const normalizedJsdoc = normalizeTypeString(jsdocType);
  const normalizedInferred = normalizeTypeString(inferredType);

  // Direct match
  if (normalizedJsdoc === normalizedInferred) {
    return true;
  }

  // Handle '*' in JSDoc (equivalent to any/unknown)
  if (normalizedJsdoc === '*') {
    return normalizedInferred === 'any' || normalizedInferred === 'unknown';
  }

  // Handle JSDoc nullable syntax: ?string -> string | null | undefined
  // Also handle trailing ? syntax: string? -> string | null | undefined
  /** @type {string | null} */
  let jsdocNullableBase = null;
  if (normalizedJsdoc.startsWith('?')) {
    jsdocNullableBase = normalizeTypeString(normalizedJsdoc.slice(1));
  } else if (normalizedJsdoc.endsWith('?') && !normalizedJsdoc.includes('|')) {
    jsdocNullableBase = normalizeTypeString(normalizedJsdoc.slice(0, -1));
  }

  if (jsdocNullableBase) {
    // If inferred is just the base type (TS infers it's always present), allow it
    if (normalizedInferred === jsdocNullableBase) {
      return true;
    }
    const inferredParts = parseUnionParts(normalizedInferred).map(normalizeTypeString);

    // Check if inferred is baseType plus null/undefined
    const hasBase = inferredParts.includes(jsdocNullableBase);
    const hasNullable = inferredParts.some((p) => p === 'null' || p === 'undefined');
    if (hasBase && hasNullable && inferredParts.length <= 3) {
      return true;
    }
  }

  // Handle JSDoc non-nullable syntax: !string -> string
  if (normalizedJsdoc.startsWith('!')) {
    const baseType = normalizeTypeString(normalizedJsdoc.slice(1));
    return normalizedInferred === baseType;
  }

  // Handle union types with different ordering
  if (normalizedJsdoc.includes('|') || normalizedInferred.includes('|')) {
    const jsdocParts = parseUnionParts(normalizedJsdoc).map(normalizeTypeString).sort();
    const inferredParts = parseUnionParts(normalizedInferred).map(normalizeTypeString).sort();

    if (jsdocParts.length === inferredParts.length) {
      // Compare parts directly to avoid infinite recursion
      const allMatch = jsdocParts.every((part, i) => {
        // Simple string match for union parts
        if (part === inferredParts[i]) return true;
        // Handle void/undefined equivalence
        if ((part === 'void' && inferredParts[i] === 'undefined') ||
            (part === 'undefined' && inferredParts[i] === 'void')) {
          return true;
        }
        // Handle Array/array vs any[] in union parts
        if (((part === 'Array' || part === 'array') && inferredParts[i] === 'any[]') ||
            (part === 'any[]' && (inferredParts[i] === 'Array' || inferredParts[i] === 'array'))) {
          return true;
        }
        // Handle function vs Function
        if ((part.toLowerCase() === 'function' && inferredParts[i] === 'Function') ||
            (part === 'Function' && inferredParts[i].toLowerCase() === 'function')) {
          return true;
        }
        // Handle generic types with default parameters (Buffer vs Buffer<ArrayBufferLike>)
        if (inferredParts[i].startsWith(part + '<') || part.startsWith(inferredParts[i] + '<')) {
          return true;
        }
        // Handle Object[] vs any[]
        if ((part === 'object[]' && inferredParts[i] === 'any[]') ||
            (part === 'any[]' && inferredParts[i] === 'object[]')) {
          return true;
        }
        return false;
      });
      if (allMatch) return true;
    }
  }

  // Handle void vs undefined
  if (
    (normalizedJsdoc === 'void' && normalizedInferred === 'undefined') ||
    (normalizedJsdoc === 'undefined' && normalizedInferred === 'void')
  ) {
    return true;
  }

  // Handle Promise<void> vs Promise<undefined>
  if (normalizedJsdoc.startsWith('Promise<') && normalizedInferred.startsWith('Promise<')) {
    const jsdocInner = normalizedJsdoc.slice(8, -1);
    const inferredInner = normalizedInferred.slice(8, -1);
    return typesMatch(jsdocInner, inferredInner);
  }

  // Handle function types - JSDoc uses function(args): return, TS uses (args) => return
  if (
    normalizedJsdoc.startsWith('function(') ||
    normalizedJsdoc.startsWith('Function') ||
    normalizedJsdoc === 'function'
  ) {
    // Basic function type match - just check it's a function
    if (
      normalizedInferred.includes('=>') ||
      normalizedInferred === 'Function' ||
      normalizedInferred === 'function'
    ) {
      // For now, accept any function match; more detailed comparison could be added
      return true;
    }
  }

  // Handle function/Function case-insensitive match
  if (normalizedJsdoc.toLowerCase() === 'function' && normalizedInferred.toLowerCase() === 'function') {
    return true;
  }

  // Handle qualified type names (e.g., fs.Stats vs Stats, http.IncomingMessage vs IncomingMessage)
  // If one has a namespace prefix and the other doesn't, compare the base name
  const jsdocNameParts = normalizedJsdoc.split('.');
  const inferredNameParts = normalizedInferred.split('.');
  const jsdocBase = jsdocNameParts[jsdocNameParts.length - 1];
  const inferredBase = inferredNameParts[inferredNameParts.length - 1];
  // Match if base names are the same and at least one has a namespace prefix
  if (jsdocBase === inferredBase && (jsdocNameParts.length > 1 || inferredNameParts.length > 1)) {
    return true;
  }

  // Handle unparameterized Array vs any[] (JSDoc often uses just "Array" or "array")
  if ((normalizedJsdoc === 'Array' || normalizedJsdoc === 'array') && normalizedInferred === 'any[]') {
    return true;
  }
  if (normalizedJsdoc === 'any[]' && (normalizedInferred === 'Array' || normalizedInferred === 'array')) {
    return true;
  }

  // Handle Object vs object (case-insensitive for the generic object type)
  if (normalizedJsdoc.toLowerCase() === 'object' && normalizedInferred.toLowerCase() === 'object') {
    return true;
  }

  // Handle generic types with default parameters (Buffer vs Buffer<ArrayBufferLike>)
  // If JSDoc has a simple type and inferred has the same type with generic params, match
  if (normalizedInferred.startsWith(normalizedJsdoc + '<') ||
      normalizedJsdoc.startsWith(normalizedInferred + '<')) {
    return true;
  }

  return false;
}

/**
 * Convert a TypeScript type string to JSDoc format.
 *
 * @param {string} tsType
 * @returns {string}
 */
export function tsTypeToJSDoc(tsType) {
  let jsdocType = normalizeTypeString(tsType);

  // Convert arrow function to JSDoc function syntax
  // (a: string, b: number) => boolean -> function(string, number): boolean
  const arrowMatch = jsdocType.match(/^\(([^)]*)\)\s*=>\s*(.+)$/);
  if (arrowMatch) {
    const params = arrowMatch[1];
    const returnType = arrowMatch[2];

    // Extract just the types from params (remove names)
    const paramTypes = params
      .split(',')
      .map((p) => {
        const colonIdx = p.indexOf(':');
        if (colonIdx !== -1) {
          return p.slice(colonIdx + 1).trim();
        }
        return p.trim();
      })
      .filter(Boolean)
      .join(', ');

    jsdocType = `function(${paramTypes}): ${returnType}`;
  }

  return jsdocType;
}

/**
 * Determine if a type is "interesting" enough to require JSDoc.
 * Simple primitives inferred from literals are not interesting.
 *
 * @param {string} type
 * @returns {boolean}
 */
export function isTypeInteresting(type) {
  const boring = ['string', 'number', 'boolean', 'null', 'undefined', 'true', 'false', 'void'];
  const normalized = normalizeTypeString(type);

  // Literal types are not interesting
  if (/^"[^"]*"$/.test(normalized) || /^'[^']*'$/.test(normalized)) {
    return false;
  }

  // Numeric literals
  if (/^-?\d+(\.\d+)?$/.test(normalized)) {
    return false;
  }

  return !boring.includes(normalized);
}

/**
 * @typedef {'primitive' | 'array' | 'object' | 'function' | 'union' | 'generic' | 'unknown'} TypeShape
 */

/**
 * Get the "shape" of a type for comparison purposes.
 * Useful for determining if two types are structurally similar.
 *
 * @param {string} type
 * @returns {TypeShape}
 */
export function getTypeShape(type) {
  const normalized = normalizeTypeString(type);

  if (normalized.includes('|')) return 'union';
  if (normalized.endsWith('[]')) return 'array';
  if (normalized.includes('=>') || normalized.startsWith('function')) return 'function';
  if (normalized.startsWith('{')) return 'object';
  if (normalized.includes('<')) return 'generic';
  if (['string', 'number', 'boolean', 'null', 'undefined', 'void', 'never', 'any', 'unknown'].includes(normalized)) {
    return 'primitive';
  }

  return 'unknown';
}

/**
 * Calculate confidence score for an inferred type.
 * Higher scores indicate more reliable inferences.
 *
 * @param {string} type
 * @returns {number} A score between 0 and 1:
 *   - 1.0: High confidence (primitives, simple types)
 *   - 0.8: Good confidence (arrays, simple generics)
 *   - 0.6: Medium confidence (unions, complex generics)
 *   - 0.4: Low confidence (any, unknown, complex nested types)
 */
export function getInferenceConfidence(type) {
  const normalized = normalizeTypeString(type);

  // Very low confidence - TypeScript doesn't know
  if (normalized === 'any' || normalized === 'unknown') {
    return 0.4;
  }

  // Very high confidence - primitives
  if (['string', 'number', 'boolean', 'null', 'undefined', 'void', 'never'].includes(normalized)) {
    return 1.0;
  }

  // High confidence - literal types
  if (/^"[^"]*"$/.test(normalized) || /^'[^']*'$/.test(normalized)) {
    return 1.0;
  }
  if (/^-?\d+(\.\d+)?$/.test(normalized)) {
    return 1.0;
  }
  if (normalized === 'true' || normalized === 'false') {
    return 1.0;
  }

  // Good confidence - simple arrays
  if (normalized.endsWith('[]') && !normalized.includes('|')) {
    const elementType = normalized.slice(0, -2);
    // any[] is less confident
    if (elementType === 'any') return 0.5;
    return 0.9;
  }

  // Medium-high confidence - simple object types, known classes
  if (/^[A-Z][a-zA-Z0-9]*$/.test(normalized)) {
    // Looks like a class/interface name (e.g., Buffer, Date, Error)
    return 0.9;
  }

  // Medium confidence - simple generics (Promise<T>, Array<T>)
  if (normalized.includes('<') && !normalized.includes('|')) {
    const depth = (normalized.match(/</g) || []).length;
    if (depth === 1) return 0.8;
    if (depth === 2) return 0.7;
    return 0.6; // Deep nesting
  }

  // Medium confidence - union types
  if (normalized.includes('|')) {
    const parts = parseUnionParts(normalized);
    if (parts.length === 2) return 0.8;
    if (parts.length <= 4) return 0.7;
    return 0.5; // Many union members
  }

  // Medium confidence - function types
  if (normalized.includes('=>') || normalized.startsWith('function(')) {
    return 0.7;
  }

  // Medium confidence - object literals
  if (normalized.startsWith('{')) {
    const properties = (normalized.match(/:/g) || []).length;
    if (properties <= 3) return 0.8;
    if (properties <= 6) return 0.7;
    return 0.6; // Many properties
  }

  // Default medium confidence for anything else
  return 0.7;
}

/**
 * JSON Schema for inferenceConfidence option.
 */
export const inferenceConfidenceSchema = {
  type: 'number',
  minimum: 0,
  maximum: 1,
  description: 'Minimum confidence threshold (0-1) for auto-fixing. Lower values allow more fixes.',
  default: 0.5,
};

/**
 * Explain why two types don't match, providing actionable guidance.
 *
 * @param {string} jsdocType
 * @param {string} inferredType
 * @returns {string}
 */
export function explainTypeMismatch(jsdocType, inferredType) {
  const jsdoc = normalizeTypeString(jsdocType);
  const inferred = normalizeTypeString(inferredType);

  // JSDoc is more defensive (includes null/undefined that TS doesn't see)
  if (jsdoc.includes('| null') || jsdoc.includes('| undefined')) {
    const jsdocParts = parseUnionParts(jsdoc);
    const inferredParts = parseUnionParts(inferred);
    const extraInJsdoc = jsdocParts.filter(p => !inferredParts.includes(p));

    if (extraInJsdoc.every(p => p === 'null' || p === 'undefined')) {
      return 'JSDoc includes null/undefined but TypeScript infers the value is always present. ' +
             'Either the code guarantees a value, or add runtime checks.';
    }
  }

  // JSDoc uses generic 'object' but TS infers specific shape
  if (jsdoc === 'object' && inferred.startsWith('{')) {
    return 'JSDoc uses generic "object" but TypeScript infers a specific shape. ' +
           'Consider using @typedef to document the object structure.';
  }

  // Types are structurally different
  const jsdocShape = getTypeShape(jsdoc);
  const inferredShape = getTypeShape(inferred);

  if (jsdocShape !== inferredShape) {
    return `JSDoc declares ${jsdocShape} but TypeScript infers ${inferredShape}.`;
  }

  // Default explanation
  return 'Types differ. Run with --fix to update JSDoc, or verify the intended type.';
}

/**
 * Format a type for display, truncating if too long.
 *
 * @param {string} type
 * @param {number} [maxLength=60]
 * @returns {string}
 */
export function formatTypeForDisplay(type, maxLength = 60) {
  if (type.length <= maxLength) {
    return type;
  }
  return type.slice(0, maxLength - 3) + '...';
}
