/**
 * Rule: require-jsdoc-types
 *
 * Exported functions must have complete JSDoc types.
 */

import { ESLintUtils } from '@typescript-eslint/utils';
import {
  getJSDocComment,
  parseJSDoc,
  getJSDocParamType,
  getJSDocReturnsType,
  generateJSDoc,
  addTag,
} from '../utils/jsdoc.js';
import { tsTypeToJSDoc, getInferenceConfidence, inferenceConfidenceSchema } from '../utils/type-comparison.js';
import { getFunctionName, shouldIgnore, ignorePatternsSchema } from '../utils/ignore.js';

/**
 * @typedef {import('../utils/jsdoc.js').JSDocTag} JSDocTag
 * @typedef {import('../utils/jsdoc.js').ParsedJSDoc} ParsedJSDoc
 * @typedef {import('@typescript-eslint/utils').TSESTree.FunctionDeclaration} FunctionDeclaration
 * @typedef {import('@typescript-eslint/utils').TSESTree.FunctionExpression} FunctionExpression
 * @typedef {import('@typescript-eslint/utils').TSESTree.ArrowFunctionExpression} ArrowFunctionExpression
 * @typedef {import('@typescript-eslint/utils').TSESTree.Node} Node
 * @typedef {import('@typescript-eslint/utils').TSESTree.Identifier} Identifier
 */

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/estl/eslint-plugin-estl/blob/main/docs/rules/${name}.md`
);

/**
 * @typedef {object} RuleOptions
 * @property {string[]} [ignorePatterns]
 * @property {number} [inferenceConfidence]
 */

/**
 * @typedef {'missingParam' | 'missingReturns' | 'missingJsdoc'} MessageIds
 */

export default createRule({
  name: 'require-jsdoc-types',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require complete JSDoc type annotations on exported functions',
    },
    fixable: 'code',
    messages: {
      missingParam: "Exported function missing JSDoc @param for '{{name}}'",
      missingReturns: 'Exported function missing JSDoc @returns',
      missingJsdoc: "{{funcName}} needs JSDoc: {{suggestion}}",
    },
    schema: [
      {
        type: 'object',
        properties: {
          ignorePatterns: ignorePatternsSchema,
          inferenceConfidence: inferenceConfidenceSchema,
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ ignorePatterns: [], inferenceConfidence: 0.5 }],
  create(context, [options]) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    /**
     * @param {Node} node
     * @returns {boolean}
     */
    function isExported(node) {
      const parent = node.parent;
      if (!parent) return false;

      // export function foo() {}
      if (parent.type === 'ExportNamedDeclaration') return true;

      // export default function() {}
      if (parent.type === 'ExportDefaultDeclaration') return true;

      // module.exports = function() {} or exports.foo = function() {}
      if (parent.type === 'AssignmentExpression') {
        const left = parent.left;
        if (left.type === 'MemberExpression') {
          if (left.object.type === 'Identifier') {
            if (left.object.name === 'exports' || left.object.name === 'module') {
              return true;
            }
          }
        }
      }

      // const foo = () => {} in export
      if (parent.type === 'VariableDeclarator' && parent.parent?.type === 'VariableDeclaration') {
        if (parent.parent.parent?.type === 'ExportNamedDeclaration') {
          return true;
        }
      }

      return false;
    }

    /**
     * @param {FunctionDeclaration | FunctionExpression | ArrowFunctionExpression} node
     */
    function checkFunction(node) {
      if (!isExported(node)) return;

      // Check if function should be ignored
      const funcName = getFunctionName(node);
      if (shouldIgnore(funcName, options.ignorePatterns || [])) return;

      // For exported functions, JSDoc might be on the export statement
      /** @type {Node} */
      let jsdocNode = node;
      if (node.parent?.type === 'ExportNamedDeclaration' || node.parent?.type === 'ExportDefaultDeclaration') {
        jsdocNode = node.parent;
      } else if (node.parent?.type === 'VariableDeclarator' && node.parent.parent?.type === 'VariableDeclaration') {
        if (node.parent.parent.parent?.type === 'ExportNamedDeclaration') {
          jsdocNode = node.parent.parent.parent;
        } else {
          jsdocNode = node.parent.parent;
        }
      }

      const jsdocComment = getJSDocComment(jsdocNode, context.sourceCode);
      /** @type {ParsedJSDoc | null} */
      const jsdoc = jsdocComment ? parseJSDoc(jsdocComment.value) : null;

      const tsNode = services.esTreeNodeToTSNodeMap.get(node);
      const signature = checker.getSignatureFromDeclaration(/** @type {any} */ (tsNode));

      /** @type {Array<{name: string, type: string, confidence: number, param: Identifier}>} */
      const missingParams = [];

      // Check all parameters have JSDoc
      for (const param of node.params) {
        if (param.type !== 'Identifier') continue;

        const paramName = param.name;
        if (jsdoc && getJSDocParamType(jsdoc, paramName)) continue;

        const paramTsNode = services.esTreeNodeToTSNodeMap.get(param);
        const inferredType = checker.getTypeAtLocation(paramTsNode);
        const inferredString = checker.typeToString(inferredType);

        missingParams.push({
          name: paramName,
          type: tsTypeToJSDoc(inferredString),
          confidence: getInferenceConfidence(inferredString),
          param: /** @type {Identifier} */ (param),
        });
      }

      // Check return type has JSDoc
      let missingReturn = false;
      let returnType = 'void';
      let returnConfidence = 1.0;
      if (signature) {
        const returnTypeObj = checker.getReturnTypeOfSignature(signature);
        const returnTypeString = checker.typeToString(returnTypeObj);
        returnType = tsTypeToJSDoc(returnTypeString);
        returnConfidence = getInferenceConfidence(returnTypeString);

        if (returnType !== 'void' && (!jsdoc || !getJSDocReturnsType(jsdoc))) {
          missingReturn = true;
        }
      }

      // Skip if nothing is missing
      if (missingParams.length === 0 && !missingReturn) return;

      // Calculate minimum confidence across all types that would be generated
      const minConfidence = options.inferenceConfidence ?? 0.5;
      const allConfidences = missingParams.map((p) => p.confidence);
      if (missingReturn) allConfidences.push(returnConfidence);
      const lowestConfidence = Math.min(...allConfidences);
      const shouldFix = lowestConfidence >= minConfidence;

      // Only report and fix once per function to avoid duplicate fixes
      if (!jsdocComment) {
        /** @type {JSDocTag[]} */
        const tags = [];

        for (const { name, type } of missingParams) {
          tags.push({ tag: 'param', type, name });
        }

        if (missingReturn && returnType !== 'void') {
          tags.push({ tag: 'returns', type: returnType });
        }

        // Build suggestion string showing what types would be added
        /** @type {string[]} */
        const suggestionParts = [];
        for (const { name, type } of missingParams) {
          suggestionParts.push(`@param {${type}} ${name}`);
        }
        if (missingReturn && returnType !== 'void') {
          suggestionParts.push(`@returns {${returnType}}`);
        }
        const suggestion = suggestionParts.join(', ');
        const displayFuncName = funcName || 'function';

        // Report at function level with fix
        context.report({
          node,
          messageId: 'missingJsdoc',
          data: {
            funcName: displayFuncName,
            suggestion,
          },
          // Only auto-fix if confidence meets threshold
          fix: shouldFix
            ? (fixer) => {
                // Find proper insertion point
                /** @type {Node} */
                let insertNode = node;
                if (node.parent?.type === 'ExportNamedDeclaration') {
                  insertNode = node.parent;
                } else if (node.parent?.type === 'ExportDefaultDeclaration') {
                  insertNode = node.parent;
                } else if (node.parent?.type === 'VariableDeclarator' && node.parent.parent) {
                  insertNode = node.parent.parent;
                  if (insertNode.parent?.type === 'ExportNamedDeclaration') {
                    insertNode = insertNode.parent;
                  }
                }

                // Get indentation
                const sourceCode = context.sourceCode;
                const line = sourceCode.lines[insertNode.loc.start.line - 1];
                const indent = line.match(/^\s*/)?.[0] || '';

                const newJsdoc = generateJSDoc({ tags }, indent);
                return fixer.insertTextBefore(insertNode, newJsdoc + '\n' + indent);
              }
            : undefined,
        });
      } else if (jsdocComment && (missingParams.length > 0 || missingReturn)) {
        // Build suggestion string for existing JSDoc case
        /** @type {string[]} */
        const suggestionParts = [];
        for (const { name, type } of missingParams) {
          suggestionParts.push(`@param {${type}} ${name}`);
        }
        if (missingReturn && returnType !== 'void') {
          suggestionParts.push(`@returns {${returnType}}`);
        }
        const suggestion = suggestionParts.join(', ');
        const displayFuncName = funcName || 'function';

        // Add missing tags to existing JSDoc
        // This is a compound fix - we need to add all missing tags at once
        context.report({
          node,
          messageId: 'missingJsdoc',
          data: {
            funcName: displayFuncName,
            suggestion,
          },
          // Only auto-fix if confidence meets threshold
          fix: shouldFix
            ? (fixer) => {
                let updatedJsdoc = /** @type {ParsedJSDoc} */ (jsdoc);
                for (const { name, type } of missingParams) {
                  const newJsdocStr = addTag(updatedJsdoc, { tag: 'param', type, name });
                  // Parse the new JSDoc to get updated structure (strip /** and */)
                  updatedJsdoc = parseJSDoc(newJsdocStr.slice(3, -3));
                }
                if (missingReturn && returnType !== 'void') {
                  const finalJsdoc = addTag(updatedJsdoc, { tag: 'returns', type: returnType });
                  return fixer.replaceTextRange(
                    [jsdocComment.range[0], jsdocComment.range[1]],
                    finalJsdoc
                  );
                }
                const finalJsdoc = generateJSDoc(updatedJsdoc);
                return fixer.replaceTextRange(
                  [jsdocComment.range[0], jsdocComment.range[1]],
                  finalJsdoc
                );
              }
            : undefined,
        });
      }
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
});
