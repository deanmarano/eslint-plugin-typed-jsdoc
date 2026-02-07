/**
 * Rule: no-implicit-any
 *
 * Require JSDoc where TypeScript falls back to `any`.
 * Groups multiple untyped parameters into a single actionable error.
 */

import { ESLintUtils } from '@typescript-eslint/utils';
import {
  getJSDocComment,
  parseJSDoc,
  getJSDocParamType,
  generateJSDoc,
  addTag,
} from '../utils/jsdoc.js';
import { getFunctionName, shouldIgnore, ignorePatternsSchema } from '../utils/ignore.js';
import {
  analyzeParameterUsage,
  getBestTypeSuggestion,
} from '../utils/type-hints.js';

/**
 * @typedef {import('../utils/jsdoc.js').ParsedJSDoc} ParsedJSDoc
 * @typedef {import('../utils/jsdoc.js').JSDocTag} JSDocTag
 * @typedef {import('@typescript-eslint/utils').TSESTree.FunctionDeclaration} FunctionDeclaration
 * @typedef {import('@typescript-eslint/utils').TSESTree.FunctionExpression} FunctionExpression
 * @typedef {import('@typescript-eslint/utils').TSESTree.ArrowFunctionExpression} ArrowFunctionExpression
 * @typedef {import('@typescript-eslint/utils').TSESTree.BlockStatement} BlockStatement
 * @typedef {import('@typescript-eslint/utils').TSESTree.Expression} Expression
 * @typedef {import('@typescript-eslint/utils').TSESTree.Node} Node
 * @typedef {import('@typescript-eslint/utils').TSESTree.Identifier} Identifier
 */

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/estl/eslint-plugin-estl/blob/main/docs/rules/${name}.md`
);

/**
 * @typedef {object} RuleOptions
 * @property {string[]} [ignorePatterns]
 * @property {boolean} [groupErrors]
 */

/**
 * @typedef {'implicitAny' | 'implicitAnyGrouped'} MessageIds
 */

export default createRule({
  name: 'no-implicit-any',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require JSDoc type annotations where TypeScript infers `any`',
    },
    fixable: 'code',
    messages: {
      implicitAny: "{{funcContext}}parameter '{{name}}' needs a type. Add: @param {{{suggestedType}}} {{name}}",
      implicitAnyGrouped: "{{funcName}} needs types for {{count}} parameter{{plural}}: {{paramList}}",
    },
    schema: [
      {
        type: 'object',
        properties: {
          ignorePatterns: ignorePatternsSchema,
          groupErrors: {
            type: 'boolean',
            description: 'Group multiple untyped parameters into a single error per function',
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ ignorePatterns: [], groupErrors: true }],
  create(context, [options]) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();
    const groupErrors = options.groupErrors !== false;

    /**
     * @param {Node} node
     * @returns {boolean}
     */
    function isExported(node) {
      const parent = node.parent;
      if (!parent) return false;
      if (parent.type === 'ExportNamedDeclaration') return true;
      if (parent.type === 'ExportDefaultDeclaration') return true;
      if (parent.type === 'AssignmentExpression') {
        const left = parent.left;
        if (left.type === 'MemberExpression' && left.object.type === 'Identifier') {
          if (left.object.name === 'exports' || left.object.name === 'module') return true;
        }
      }
      if (parent.type === 'VariableDeclarator' && parent.parent?.type === 'VariableDeclaration') {
        if (parent.parent.parent?.type === 'ExportNamedDeclaration') return true;
      }
      return false;
    }

    /**
     * @param {FunctionDeclaration | FunctionExpression | ArrowFunctionExpression} node
     * @returns {BlockStatement | Expression | null}
     */
    function getFunctionBody(node) {
      return node.body;
    }

    /**
     * @param {FunctionDeclaration | FunctionExpression | ArrowFunctionExpression} node
     */
    function checkFunction(node) {
      // Check if function should be ignored
      const funcName = getFunctionName(node);
      if (shouldIgnore(funcName, options.ignorePatterns || [])) return;

      const jsdocComment = getJSDocComment(node, context.sourceCode);
      /** @type {ParsedJSDoc} */
      const jsdoc = jsdocComment ? parseJSDoc(jsdocComment.value) : { tags: [], raw: '' };

      const functionBody = getFunctionBody(node);
      /** @type {Array<{name: string, param: Identifier, suggestedType: string}>} */
      const implicitAnyParams = [];

      for (const param of node.params) {
        if (param.type !== 'Identifier') continue;

        const paramName = param.name;

        // Skip if already has JSDoc type
        if (getJSDocParamType(jsdoc, paramName)) continue;

        const tsNode = services.esTreeNodeToTSNodeMap.get(param);
        const inferredType = checker.getTypeAtLocation(tsNode);
        const inferredString = checker.typeToString(inferredType);

        // Check if it's implicit any
        if (inferredString === 'any') {
          // Check if this is truly implicit (not from JSDoc or annotation)
          const typeFlags = inferredType.getFlags();
          // TypeScript's Any flag is 1
          if (typeFlags & 1) {
            // Analyze usage to suggest a better type
            const usage = analyzeParameterUsage(paramName, functionBody, context.sourceCode);
            const suggestedType = getBestTypeSuggestion(paramName, usage);

            implicitAnyParams.push({
              name: paramName,
              param: /** @type {Identifier} */ (param),
              suggestedType,
            });
          }
        }
      }

      if (implicitAnyParams.length === 0) return;

      // Skip fix for exported functions - require-jsdoc-types handles those
      const shouldFix = !isExported(node);

      // Group errors or report individually
      if (groupErrors && implicitAnyParams.length > 1) {
        // Report a single grouped error at the function level
        const displayFuncName = funcName || 'function';

        // Show params with their suggested types for actionability
        const paramListWithTypes = implicitAnyParams
          .map((p) => p.suggestedType !== 'unknown' ? `${p.name}: ${p.suggestedType}` : p.name)
          .join(', ');

        context.report({
          node,
          messageId: 'implicitAnyGrouped',
          data: {
            funcName: displayFuncName,
            count: String(implicitAnyParams.length),
            plural: implicitAnyParams.length > 1 ? 's' : '',
            paramList: paramListWithTypes,
          },
          fix: shouldFix
            ? (fixer) => {
                /** @type {JSDocTag[]} */
                const tags = implicitAnyParams.map((p) => ({
                  tag: 'param',
                  type: p.suggestedType,
                  name: p.name,
                }));

                if (!jsdocComment) {
                  // Generate new JSDoc before the function
                  /** @type {Node} */
                  let insertNode = node;
                  if (node.parent?.type === 'VariableDeclarator') {
                    insertNode = /** @type {Node} */ (node.parent.parent);
                  }

                  const sourceCode = context.sourceCode;
                  const line = sourceCode.lines[insertNode.loc.start.line - 1];
                  const indent = line.match(/^\s*/)?.[0] || '';

                  return fixer.insertTextBefore(
                    insertNode,
                    generateJSDoc({ tags }, indent) + '\n' + indent
                  );
                } else {
                  // Add all @param tags to existing JSDoc
                  let updatedJsdoc = jsdoc;
                  for (const tag of tags) {
                    const newJsdocStr = addTag(updatedJsdoc, tag);
                    updatedJsdoc = parseJSDoc(newJsdocStr.slice(3, -3));
                  }
                  return fixer.replaceTextRange(
                    [jsdocComment.range[0], jsdocComment.range[1]],
                    generateJSDoc(updatedJsdoc)
                  );
                }
              }
            : undefined,
        });
      } else {
        // Report each parameter individually (for single params or when grouping disabled)
        for (const { name, param, suggestedType } of implicitAnyParams) {
          const funcContext = funcName ? `In ${funcName}(): ` : '';
          context.report({
            node: param,
            messageId: 'implicitAny',
            data: { name, funcContext, suggestedType },
            fix: shouldFix
              ? (fixer) => {
                  /** @type {JSDocTag} */
                  const newTag = { tag: 'param', type: suggestedType, name };

                  if (!jsdocComment) {
                    /** @type {Node} */
                    let insertNode = node;
                    if (node.parent?.type === 'VariableDeclarator') {
                      insertNode = /** @type {Node} */ (node.parent.parent);
                    }

                    const sourceCode = context.sourceCode;
                    const line = sourceCode.lines[insertNode.loc.start.line - 1];
                    const indent = line.match(/^\s*/)?.[0] || '';

                    return fixer.insertTextBefore(
                      insertNode,
                      generateJSDoc({ tags: [newTag] }, indent) + '\n' + indent
                    );
                  } else {
                    const newJsdoc = addTag(jsdoc, newTag);
                    return fixer.replaceTextRange(
                      [jsdocComment.range[0], jsdocComment.range[1]],
                      newJsdoc
                    );
                  }
                }
              : undefined,
          });
        }
      }
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
});
