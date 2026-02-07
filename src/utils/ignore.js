/**
 * Utilities for ignoring functions based on patterns.
 */

/**
 * @typedef {import('@typescript-eslint/utils').TSESTree.FunctionDeclaration} FunctionDeclaration
 * @typedef {import('@typescript-eslint/utils').TSESTree.FunctionExpression} FunctionExpression
 * @typedef {import('@typescript-eslint/utils').TSESTree.ArrowFunctionExpression} ArrowFunctionExpression
 */

/**
 * Gets the name of a function node, if it has one.
 * @param {FunctionDeclaration | FunctionExpression | ArrowFunctionExpression} node
 * @returns {string | null}
 */
export function getFunctionName(node) {
  // Named function declaration
  if (node.type === 'FunctionDeclaration' && node.id) {
    return node.id.name;
  }

  // Function expression or arrow function in variable declaration
  if (node.parent?.type === 'VariableDeclarator' && node.parent.id.type === 'Identifier') {
    return node.parent.id.name;
  }

  // Function expression assigned to property
  if (node.parent?.type === 'Property' && node.parent.key.type === 'Identifier') {
    return node.parent.key.name;
  }

  // Method definition
  if (node.parent?.type === 'MethodDefinition' && node.parent.key.type === 'Identifier') {
    return node.parent.key.name;
  }

  // Assignment to exports.name or module.exports.name
  if (node.parent?.type === 'AssignmentExpression' && node.parent.left.type === 'MemberExpression') {
    const prop = node.parent.left.property;
    if (prop.type === 'Identifier') {
      return prop.name;
    }
  }

  return null;
}

/**
 * Check if a function name matches any of the ignore patterns.
 * Patterns can be:
 * - Exact strings: "test", "describe"
 * - Glob-like with asterisk: "test*", "*Callback"
 * - Regex if wrapped in slashes: "/pattern/"
 *
 * @param {string | null} name
 * @param {string[]} patterns
 * @returns {boolean}
 */
export function shouldIgnore(name, patterns) {
  if (!name || patterns.length === 0) return false;

  for (const pattern of patterns) {
    // Regex pattern (wrapped in slashes)
    if (pattern.startsWith('/') && pattern.endsWith('/')) {
      try {
        const regex = new RegExp(pattern.slice(1, -1));
        if (regex.test(name)) return true;
      } catch {
        // Invalid regex, skip
      }
      continue;
    }

    // Glob-like pattern with asterisk
    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
        .replace(/\*/g, '.*'); // Convert * to .*
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(name)) return true;
      continue;
    }

    // Exact match
    if (name === pattern) return true;
  }

  return false;
}

/**
 * JSON Schema for ignorePatterns option.
 */
export const ignorePatternsSchema = {
  type: 'array',
  items: { type: 'string' },
  description: 'Function name patterns to ignore. Supports exact match, glob (*), or regex (/pattern/).',
  default: [],
};
