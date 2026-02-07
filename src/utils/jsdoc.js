/**
 * JSDoc extraction and manipulation utilities.
 */

/**
 * @typedef {import('@typescript-eslint/utils').TSESTree.Node} Node
 * @typedef {import('@typescript-eslint/utils').TSESTree.Comment} Comment
 */

/**
 * @typedef {object} JSDocTag
 * @property {string} tag
 * @property {string} [name]
 * @property {string} [type]
 * @property {string} [description]
 * @property {boolean} [optional]
 * @property {string} [defaultValue]
 */

/**
 * @typedef {object} ParsedJSDoc
 * @property {string} [description]
 * @property {JSDocTag[]} tags
 * @property {string} raw
 */

/**
 * Extract JSDoc comment attached to a node.
 * Handles the case where the comment is before an export statement.
 *
 * @param {Node} node
 * @param {{ getCommentsBefore(node: Node): Comment[] }} sourceCode
 * @returns {Comment | undefined}
 */
export function getJSDocComment(node, sourceCode) {
  // First, check for comments directly before this node
  let comments = sourceCode.getCommentsBefore(node);

  // If no comments found and this node is inside an ExportNamedDeclaration,
  // check for comments before the export statement instead
  if (comments.length === 0 && node.parent?.type === 'ExportNamedDeclaration') {
    comments = sourceCode.getCommentsBefore(node.parent);
  }

  // Find the last block comment that looks like JSDoc
  for (let i = comments.length - 1; i >= 0; i--) {
    const comment = comments[i];
    if (comment.type === 'Block' && comment.value.startsWith('*')) {
      return comment;
    }
  }
  return undefined;
}

/**
 * Extract a type from a string, handling nested braces.
 * Returns [type, remainingString] or [undefined, originalString] if no type found.
 *
 * @param {string} str
 * @returns {[string | undefined, string]}
 */
function extractType(str) {
  const trimmed = str.trimStart();
  if (!trimmed.startsWith('{')) {
    return [undefined, str];
  }

  let depth = 0;
  let i = 0;
  for (; i < trimmed.length; i++) {
    if (trimmed[i] === '{') depth++;
    else if (trimmed[i] === '}') {
      depth--;
      if (depth === 0) {
        const type = trimmed.slice(1, i).trim();
        const remaining = trimmed.slice(i + 1);
        return [type, remaining];
      }
    }
  }

  // Unclosed brace - return what we have
  return [trimmed.slice(1).trim(), ''];
}

/**
 * Extract a parameter name, handling optional syntax [name] and [name=default].
 * Returns [name, optional, defaultValue, remainingString].
 *
 * @param {string} str
 * @returns {[string | undefined, boolean, string | undefined, string]}
 */
function extractParamName(str) {
  const trimmed = str.trimStart();

  // Check for optional parameter syntax: [name] or [name=default]
  if (trimmed.startsWith('[')) {
    const closeIdx = trimmed.indexOf(']');
    if (closeIdx === -1) {
      return [undefined, false, undefined, str];
    }

    const inner = trimmed.slice(1, closeIdx);
    const remaining = trimmed.slice(closeIdx + 1);

    // Check for default value
    const eqIdx = inner.indexOf('=');
    if (eqIdx !== -1) {
      const name = inner.slice(0, eqIdx).trim();
      const defaultValue = inner.slice(eqIdx + 1).trim();
      return [name, true, defaultValue, remaining];
    }

    return [inner.trim(), true, undefined, remaining];
  }

  // Regular parameter name (word characters, dots for nested props)
  const match = trimmed.match(/^([\w$.]+)/);
  if (match) {
    return [match[1], false, undefined, trimmed.slice(match[1].length)];
  }

  return [undefined, false, undefined, str];
}

/**
 * Parse a single JSDoc tag line.
 *
 * @param {string} line
 * @returns {JSDocTag | null}
 */
function parseTagLine(line) {
  const tagMatch = line.match(/^@(\w+)\s*/);
  if (!tagMatch) return null;

  const tag = tagMatch[1];
  let remaining = line.slice(tagMatch[0].length);

  // Extract type if present
  const [type, afterType] = extractType(remaining);
  remaining = afterType;

  // For param tags, extract name
  /** @type {string | undefined} */
  let name;
  let optional = false;
  /** @type {string | undefined} */
  let defaultValue;

  if (tag === 'param' || tag === 'arg' || tag === 'argument' || tag === 'property' || tag === 'prop') {
    [name, optional, defaultValue, remaining] = extractParamName(remaining);
  }

  // Rest is description
  const description = remaining.trim() || undefined;

  return { tag, type, name, description, optional: optional || undefined, defaultValue };
}

/**
 * Parse a JSDoc comment into structured data.
 *
 * @param {string} comment
 * @returns {ParsedJSDoc}
 */
export function parseJSDoc(comment) {
  const lines = comment.split('\n');
  /** @type {JSDocTag[]} */
  const tags = [];
  let description = '';
  /** @type {JSDocTag | null} */
  let currentTag = null;
  let inDescription = true;

  for (const line of lines) {
    // Remove leading asterisks and whitespace
    const trimmed = line.replace(/^\s*\*\s?/, '').replace(/\s*\*?\/?$/, '');

    // Skip empty lines at start/end
    if (!trimmed) {
      if (currentTag && currentTag.description) {
        currentTag.description += '\n';
      }
      continue;
    }

    // Check for a new tag
    if (trimmed.startsWith('@')) {
      inDescription = false;
      if (currentTag) {
        // Clean up description
        if (currentTag.description) {
          currentTag.description = currentTag.description.trim();
        }
        tags.push(currentTag);
      }
      currentTag = parseTagLine(trimmed);
    } else if (currentTag) {
      // Continuation of previous tag's description
      if (currentTag.description) {
        currentTag.description += ' ' + trimmed;
      } else {
        currentTag.description = trimmed;
      }
    } else if (inDescription) {
      // Part of the main description
      if (description) {
        description += ' ' + trimmed;
      } else {
        description = trimmed;
      }
    }
  }

  if (currentTag) {
    if (currentTag.description) {
      currentTag.description = currentTag.description.trim();
    }
    tags.push(currentTag);
  }

  return {
    description: description.trim() || undefined,
    tags,
    raw: comment,
  };
}

/**
 * Get JSDoc @param type for a specific parameter name.
 * Handles dotted names for destructured params (e.g., "options.timeout").
 *
 * @param {ParsedJSDoc} jsdoc
 * @param {string} paramName
 * @returns {string | undefined}
 */
export function getJSDocParamType(jsdoc, paramName) {
  const paramTags = ['param', 'arg', 'argument'];
  const tag = jsdoc.tags.find(
    (t) => paramTags.includes(t.tag) && (t.name === paramName || t.name?.startsWith(paramName + '.'))
  );
  return tag?.type;
}

/**
 * Get JSDoc @param tag for a specific parameter name.
 *
 * @param {ParsedJSDoc} jsdoc
 * @param {string} paramName
 * @returns {JSDocTag | undefined}
 */
export function getJSDocParam(jsdoc, paramName) {
  const paramTags = ['param', 'arg', 'argument'];
  return jsdoc.tags.find((t) => paramTags.includes(t.tag) && t.name === paramName);
}

/**
 * Get JSDoc @returns type.
 *
 * @param {ParsedJSDoc} jsdoc
 * @returns {string | undefined}
 */
export function getJSDocReturnsType(jsdoc) {
  const tag = jsdoc.tags.find((t) => t.tag === 'returns' || t.tag === 'return');
  return tag?.type;
}

/**
 * Get JSDoc @type annotation.
 *
 * @param {ParsedJSDoc} jsdoc
 * @returns {string | undefined}
 */
export function getJSDocType(jsdoc) {
  const tag = jsdoc.tags.find((t) => t.tag === 'type');
  return tag?.type;
}

/**
 * Get all @typedef tags.
 *
 * @param {ParsedJSDoc} jsdoc
 * @returns {JSDocTag[]}
 */
export function getJSDocTypedefs(jsdoc) {
  return jsdoc.tags.filter((t) => t.tag === 'typedef');
}

/**
 * Generate a JSDoc comment string from structured data.
 *
 * @param {Omit<ParsedJSDoc, 'raw'>} jsdoc
 * @param {string} [indent='']
 * @returns {string}
 */
export function generateJSDoc(jsdoc, indent = '') {
  /** @type {string[]} */
  const lines = [`${indent}/**`];

  if (jsdoc.description) {
    // Handle multiline descriptions
    const descLines = jsdoc.description.split('\n');
    for (const descLine of descLines) {
      lines.push(`${indent} * ${descLine}`);
    }
    if (jsdoc.tags.length > 0) {
      lines.push(`${indent} *`);
    }
  }

  for (const tag of jsdoc.tags) {
    let line = `${indent} * @${tag.tag}`;
    if (tag.type) {
      line += ` {${tag.type}}`;
    }
    if (tag.name) {
      if (tag.optional) {
        if (tag.defaultValue !== undefined) {
          line += ` [${tag.name}=${tag.defaultValue}]`;
        } else {
          line += ` [${tag.name}]`;
        }
      } else {
        line += ` ${tag.name}`;
      }
    }
    if (tag.description) {
      // Handle multiline tag descriptions
      const tagDescLines = tag.description.split('\n');
      line += ` ${tagDescLines[0]}`;
      lines.push(line);
      for (let i = 1; i < tagDescLines.length; i++) {
        lines.push(`${indent} *   ${tagDescLines[i]}`);
      }
    } else {
      lines.push(line);
    }
  }

  lines.push(`${indent} */`);
  return lines.join('\n');
}

/**
 * Update a specific tag's type in a JSDoc comment.
 * Returns the new JSDoc string.
 *
 * @param {ParsedJSDoc} jsdoc
 * @param {string} tagName
 * @param {string | undefined} paramName
 * @param {string} newType
 * @returns {string}
 */
export function updateTagType(jsdoc, tagName, paramName, newType) {
  /** @type {ParsedJSDoc} */
  const updated = {
    ...jsdoc,
    tags: jsdoc.tags.map((tag) => {
      if (tag.tag === tagName && (!paramName || tag.name === paramName)) {
        return { ...tag, type: newType };
      }
      return tag;
    }),
  };
  return generateJSDoc(updated);
}

/**
 * Remove a specific tag from a JSDoc comment.
 * Returns the new JSDoc string, or undefined if the JSDoc would be empty.
 *
 * @param {ParsedJSDoc} jsdoc
 * @param {string} tagName
 * @param {string} [paramName]
 * @returns {string | undefined}
 */
export function removeTag(jsdoc, tagName, paramName) {
  const remainingTags = jsdoc.tags.filter((tag) => {
    if (tag.tag !== tagName) return true;
    if (paramName && tag.name !== paramName) return true;
    return false;
  });

  if (!jsdoc.description && remainingTags.length === 0) {
    return undefined; // JSDoc would be empty
  }

  return generateJSDoc({ description: jsdoc.description, tags: remainingTags });
}

/**
 * Add a tag to a JSDoc comment.
 * Returns the new JSDoc string.
 *
 * @param {ParsedJSDoc | undefined} jsdoc
 * @param {JSDocTag} tag
 * @returns {string}
 */
export function addTag(jsdoc, tag) {
  if (jsdoc) {
    return generateJSDoc({
      description: jsdoc.description,
      tags: [...jsdoc.tags, tag],
    });
  }
  return generateJSDoc({
    tags: [tag],
  });
}
