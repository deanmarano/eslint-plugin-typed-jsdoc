/**
 * Utilities for inferring type hints from parameter usage patterns.
 * These provide smarter suggestions than just "unknown".
 */

/**
 * @typedef {import('@typescript-eslint/utils').TSESTree.BlockStatement} BlockStatement
 * @typedef {import('@typescript-eslint/utils').TSESTree.Expression} Expression
 * @typedef {import('@typescript-eslint/utils').TSESTree.Node} Node
 * @typedef {import('@typescript-eslint/utils/ts-eslint').SourceCode} SourceCode
 */

/**
 * @typedef {object} UsagePattern
 * @property {boolean} isCalledAsFunction
 * @property {boolean} hasArrayMethods
 * @property {boolean} hasStringMethods
 * @property {boolean} hasNumberOperations
 * @property {boolean} hasPropertyAccess
 * @property {Set<string>} propertyNames
 * @property {boolean} isSpread
 * @property {boolean} isAwaited
 */

/**
 * Analyze how a parameter is used within a function body.
 *
 * @param {string} paramName
 * @param {BlockStatement | Expression | null} functionBody
 * @param {SourceCode} sourceCode
 * @returns {UsagePattern}
 */
export function analyzeParameterUsage(paramName, functionBody, sourceCode) {
  /** @type {UsagePattern} */
  const pattern = {
    isCalledAsFunction: false,
    hasArrayMethods: false,
    hasStringMethods: false,
    hasNumberOperations: false,
    hasPropertyAccess: false,
    propertyNames: new Set(),
    isSpread: false,
    isAwaited: false,
  };

  if (!functionBody) return pattern;

  const arrayMethods = new Set([
    'map', 'filter', 'reduce', 'forEach', 'find', 'findIndex', 'some', 'every',
    'includes', 'indexOf', 'slice', 'splice', 'push', 'pop', 'shift', 'unshift',
    'concat', 'join', 'reverse', 'sort', 'flat', 'flatMap', 'fill', 'entries',
    'keys', 'values', 'at', 'copyWithin', 'toReversed', 'toSorted', 'toSpliced',
  ]);

  const stringMethods = new Set([
    'charAt', 'charCodeAt', 'codePointAt', 'concat', 'endsWith', 'includes',
    'indexOf', 'lastIndexOf', 'localeCompare', 'match', 'matchAll', 'normalize',
    'padEnd', 'padStart', 'repeat', 'replace', 'replaceAll', 'search', 'slice',
    'split', 'startsWith', 'substring', 'toLowerCase', 'toUpperCase', 'trim',
    'trimEnd', 'trimStart', 'valueOf', 'at', 'normalize',
  ]);

  /**
   * Walk the function body looking for usages of the parameter
   * @param {Node} node
   */
  function visit(node) {
    if (!node) return;

    // Check for function calls: param()
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'Identifier' &&
      node.callee.name === paramName
    ) {
      pattern.isCalledAsFunction = true;
    }

    // Check for method calls: param.method()
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'MemberExpression' &&
      node.callee.object.type === 'Identifier' &&
      node.callee.object.name === paramName &&
      node.callee.property.type === 'Identifier'
    ) {
      const methodName = node.callee.property.name;
      pattern.hasPropertyAccess = true;
      pattern.propertyNames.add(methodName);

      if (arrayMethods.has(methodName)) {
        pattern.hasArrayMethods = true;
      }
      if (stringMethods.has(methodName)) {
        pattern.hasStringMethods = true;
      }
    }

    // Check for property access: param.prop or param['prop']
    if (
      node.type === 'MemberExpression' &&
      node.object.type === 'Identifier' &&
      node.object.name === paramName
    ) {
      pattern.hasPropertyAccess = true;
      if (node.property.type === 'Identifier') {
        pattern.propertyNames.add(node.property.name);

        // Check for .length (common for arrays and strings)
        if (node.property.name === 'length') {
          // Could be array or string - we'll check other usage
        }
      }
    }

    // Check for arithmetic operations
    if (
      node.type === 'BinaryExpression' &&
      ['+', '-', '*', '/', '%', '**'].includes(node.operator)
    ) {
      /**
       * @param {Node} n
       * @returns {boolean}
       */
      const hasParam = (n) => {
        if (n.type === 'Identifier' && n.name === paramName) return true;
        if (n.type === 'BinaryExpression') {
          return hasParam(n.left) || hasParam(n.right);
        }
        return false;
      };
      // Only count as number if it's not string concatenation context
      if (node.operator !== '+' && hasParam(node)) {
        pattern.hasNumberOperations = true;
      }
    }

    // Check for spread: ...param
    if (node.type === 'SpreadElement' && node.argument.type === 'Identifier' && node.argument.name === paramName) {
      pattern.isSpread = true;
    }

    // Check for await: await param
    if (node.type === 'AwaitExpression' && node.argument.type === 'Identifier' && node.argument.name === paramName) {
      pattern.isAwaited = true;
    }

    // Recurse into child nodes
    for (const key of Object.keys(node)) {
      if (key === 'parent') continue;
      const child = /** @type {any} */ (node)[key];
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === 'object' && 'type' in item) {
              visit(item);
            }
          }
        } else if ('type' in child) {
          visit(child);
        }
      }
    }
  }

  visit(functionBody);
  return pattern;
}

/**
 * Suggest a type based on usage patterns.
 * Returns 'unknown' if no clear pattern is detected.
 *
 * @param {UsagePattern} usage
 * @returns {string}
 */
export function suggestTypeFromUsage(usage) {
  // Called as function -> Function
  if (usage.isCalledAsFunction) {
    return 'Function';
  }

  // Awaited -> Promise<unknown>
  if (usage.isAwaited) {
    return 'Promise<unknown>';
  }

  // Clear array usage
  if (usage.hasArrayMethods && !usage.hasStringMethods) {
    return 'any[]';
  }

  // Clear string usage (and not array)
  if (usage.hasStringMethods && !usage.hasArrayMethods) {
    return 'string';
  }

  // Number operations
  if (usage.hasNumberOperations) {
    return 'number';
  }

  // Spread could be array or object
  if (usage.isSpread) {
    return 'any[] | object';
  }

  // Has property access but no specific pattern -> object
  if (usage.hasPropertyAccess && usage.propertyNames.size > 0) {
    // Could generate an interface, but for now just use object
    return 'object';
  }

  // Default
  return 'unknown';
}

/**
 * Common parameter name patterns and their likely types.
 * Order matters - more specific patterns should come first.
 * A null type means "pattern matched, but don't make a specific suggestion".
 *
 * @type {Array<[RegExp, string | null]>}
 */
const commonParamPatterns = [
  // Intentionally unused parameters - don't suggest anything specific
  [/^_+$/, 'unknown'],
  [/^\$\d+$/, 'string'], // Regex capture groups like $0, $1

  // Callbacks and functions
  [/^(callback|cb|fn|func|handler|listener|onSuccess|onError|onComplete|done|next)$/i, 'Function'],
  [/Callback$/i, 'Function'],
  [/Handler$/i, 'Function'],
  [/Fn$/i, 'Function'],

  // Errors
  [/^(err|error|exception)$/i, 'Error'],

  // Events (not 'e' - too ambiguous, could be Error or Event)
  [/^(event|evt)$/i, 'Event'],

  // Request/Response (Express-style)
  [/^(req|request)$/i, 'object'],
  [/^(res|response)$/i, 'object'],

  // String patterns - common naming conventions
  [/^(id|key|name|title|label|message|text|str|string|path|url|uri|href|src|charset|encoding|type|mime|format|pattern|prefix|suffix|separator|delimiter)$/i, 'string'],
  [/Id$/, 'string'],
  [/Name$/, 'string'],
  [/Path$/, 'string'],
  [/Url$/, 'string'],

  // Number patterns
  [/^(count|index|idx|num|number|size|length|width|height|x|y|z|offset|limit|max|min|start|end|from|to|port|timeout|delay|duration|age|year|month|day|hour|minute|second)$/i, 'number'],
  [/Count$/, 'number'],
  [/Index$/, 'number'],
  [/Size$/, 'number'],

  // Boolean patterns
  [/^(flag|enabled|disabled|active|visible|hidden|async|sync|recursive|force|silent|verbose|debug|raw|loose|strict|optional|required|incPr|includePrerelease)$/i, 'boolean'],
  [/^is[A-Z]/, 'boolean'],
  [/^has[A-Z]/, 'boolean'],
  [/^can[A-Z]/, 'boolean'],
  [/^should[A-Z]/, 'boolean'],
  [/^(gt|gte|lt|lte|eq|neq)$/, 'boolean'], // Comparison result vars

  // Object patterns - must come before /s$/ catch-all since many end in 's'
  [/^(data|obj|object|options|config|settings|props|params|payload|body|meta|context|ctx|state|attrs|attributes|headers|query|cookies)$/i, 'object'],
  [/Options$/, 'object'],
  [/Config$/, 'object'],

  // Array patterns
  [/^(items|list|array|elements|entries|keys|results|versions|files|lines|parts|chunks|segments|args)$/i, 'any[]'],
  [/s$/, null], // Plural names might be arrays, but don't assume

  // Semver/version patterns (common in npm ecosystem)
  [/^(version|ver|v)$/i, 'string'],
  [/^(range|semver|comp|comparator)$/i, 'string'],

  // Single letter params often used in callbacks - be conservative
  [/^[a-z]$/, null], // Single letters are too ambiguous
  [/^[A-Z]$/, 'string'], // Uppercase single letters often regex captures
];

/**
 * Suggest a type based on parameter name conventions.
 * Returns the suggested type, or null if no pattern matches.
 *
 * @param {string} paramName
 * @returns {string | null}
 */
export function suggestTypeFromName(paramName) {
  for (const [pattern, type] of commonParamPatterns) {
    if (pattern.test(paramName)) {
      // Pattern matched - return the type (which may be null to indicate "matched but no suggestion")
      return type;
    }
  }
  // No pattern matched
  return null;
}

/**
 * High-confidence name patterns that should take priority over usage analysis.
 * These are names that are almost always a specific type regardless of how they're used.
 *
 * @type {Array<[RegExp, string]>}
 */
const priorityNamePatterns = [
  // Function-like names - functions are objects, so property access shouldn't override this
  [/^(callback|cb|fn|func|handler|listener|onSuccess|onError|onComplete|done|next)$/i, 'Function'],
  [/Callback$/i, 'Function'],
  [/Handler$/i, 'Function'],
  [/Fn$/i, 'Function'],

  // Error names - errors are objects with properties, shouldn't be overridden
  [/^(err|error|exception)$/i, 'Error'],

  // Request/Response are always objects
  [/^(req|request)$/i, 'object'],
  [/^(res|response)$/i, 'object'],
];

/**
 * Get the best type suggestion combining usage analysis and name patterns.
 *
 * @param {string} paramName
 * @param {UsagePattern} usage
 * @returns {string}
 */
export function getBestTypeSuggestion(paramName, usage) {
  // First check high-priority name patterns that shouldn't be overridden by usage
  for (const [pattern, type] of priorityNamePatterns) {
    if (pattern.test(paramName)) {
      return type;
    }
  }

  // Strong usage signals take priority (called as function, array methods, etc.)
  if (usage.isCalledAsFunction) {
    return 'Function';
  }
  if (usage.isAwaited) {
    return 'Promise<unknown>';
  }
  if (usage.hasArrayMethods && !usage.hasStringMethods) {
    return 'any[]';
  }
  if (usage.hasStringMethods && !usage.hasArrayMethods) {
    return 'string';
  }
  if (usage.hasNumberOperations) {
    return 'number';
  }

  // Fall back to name-based suggestion
  const nameType = suggestTypeFromName(paramName);
  if (nameType) {
    return nameType;
  }

  // Weak usage signals (just property access)
  if (usage.isSpread) {
    return 'any[] | object';
  }
  if (usage.hasPropertyAccess && usage.propertyNames.size > 0) {
    return 'object';
  }

  return 'unknown';
}
