/**
 * Rule: accurate-jsdoc
 *
 * JSDoc types must match TypeScript's inference.
 */

import { ESLintUtils } from '@typescript-eslint/utils';
import {
  getJSDocComment,
  parseJSDoc,
  getJSDocParamType,
  getJSDocReturnsType,
  updateTagType,
} from '../utils/jsdoc.js';
import {
  typesMatch,
  tsTypeToJSDoc,
  getInferenceConfidence,
  inferenceConfidenceSchema,
  explainTypeMismatch,
  formatTypeForDisplay,
} from '../utils/type-comparison.js';
import { getFunctionName, shouldIgnore, ignorePatternsSchema } from '../utils/ignore.js';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/estl/eslint-plugin-estl/blob/main/docs/rules/${name}.md`
);

/**
 * @typedef {object} RuleOptions
 * @property {string[]} [ignorePatterns]
 * @property {number} [inferenceConfidence]
 */

/**
 * @typedef {'paramMismatch' | 'returnsMismatch'} MessageIds
 */

export default createRule({
  name: 'accurate-jsdoc',
  meta: {
    type: 'problem',
    docs: {
      description: 'JSDoc types must match TypeScript inference',
    },
    fixable: 'code',
    messages: {
      paramMismatch: "@param '{{name}}': {{jsdoc}} → {{inferred}}. {{explanation}}",
      returnsMismatch: "@returns: {{jsdoc}} → {{inferred}}. {{explanation}}",
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
     * @param {import('@typescript-eslint/utils').TSESTree.FunctionDeclaration | import('@typescript-eslint/utils').TSESTree.FunctionExpression | import('@typescript-eslint/utils').TSESTree.ArrowFunctionExpression} node
     */
    function checkFunction(node) {
      // Check if function should be ignored
      const funcName = getFunctionName(node);
      if (shouldIgnore(funcName, options.ignorePatterns || [])) return;

      const jsdocComment = getJSDocComment(node, context.sourceCode);
      if (!jsdocComment) return;

      const jsdoc = parseJSDoc(jsdocComment.value);

      // Check parameters
      for (const param of node.params) {
        if (param.type !== 'Identifier') continue;

        const paramName = param.name;
        const jsdocType = getJSDocParamType(jsdoc, paramName);
        if (!jsdocType) continue;

        const tsNode = services.esTreeNodeToTSNodeMap.get(param);
        const inferredType = checker.getTypeAtLocation(tsNode);
        const inferredString = checker.typeToString(inferredType);

        // If TypeScript infers 'any', JSDoc is providing the type, not contradicting it
        // This case is handled by no-implicit-any rule instead
        if (inferredString === 'any') continue;

        if (!typesMatch(jsdocType, inferredString)) {
          const correctedType = tsTypeToJSDoc(inferredString);
          const confidence = getInferenceConfidence(inferredString);
          const minConfidence = options.inferenceConfidence ?? 0.5;

          context.report({
            node: param,
            messageId: 'paramMismatch',
            data: {
              name: paramName,
              jsdoc: formatTypeForDisplay(jsdocType),
              inferred: formatTypeForDisplay(inferredString),
              explanation: explainTypeMismatch(jsdocType, inferredString),
            },
            // Only auto-fix if confidence meets threshold
            fix: confidence >= minConfidence
              ? (fixer) => {
                  // Update the JSDoc type
                  const newJsdoc = updateTagType(jsdoc, 'param', paramName, correctedType);
                  return fixer.replaceTextRange(
                    [jsdocComment.range[0], jsdocComment.range[1]],
                    newJsdoc
                  );
                }
              : undefined,
          });
        }
      }

      // Check return type
      const jsdocReturnType = getJSDocReturnsType(jsdoc);
      if (jsdocReturnType) {
        const tsNode = services.esTreeNodeToTSNodeMap.get(node);
        const signature = checker.getSignatureFromDeclaration(/** @type {any} */ (tsNode));
        if (signature) {
          const returnType = checker.getReturnTypeOfSignature(signature);
          const inferredString = checker.typeToString(returnType);

          // If TypeScript infers 'any', JSDoc is providing the type, not contradicting it
          if (inferredString === 'any') return;

          if (!typesMatch(jsdocReturnType, inferredString)) {
            const correctedType = tsTypeToJSDoc(inferredString);
            const confidence = getInferenceConfidence(inferredString);
            const minConfidence = options.inferenceConfidence ?? 0.5;

            // Find which tag name is used (returns or return)
            const returnTag = jsdoc.tags.find((t) => t.tag === 'returns' || t.tag === 'return');
            const tagName = returnTag?.tag || 'returns';

            context.report({
              node,
              messageId: 'returnsMismatch',
              data: {
                jsdoc: formatTypeForDisplay(jsdocReturnType),
                inferred: formatTypeForDisplay(inferredString),
                explanation: explainTypeMismatch(jsdocReturnType, inferredString),
              },
              // Only auto-fix if confidence meets threshold
              fix: confidence >= minConfidence
                ? (fixer) => {
                    const newJsdoc = updateTagType(jsdoc, tagName, undefined, correctedType);
                    return fixer.replaceTextRange(
                      [jsdocComment.range[0], jsdocComment.range[1]],
                      newJsdoc
                    );
                  }
                : undefined,
            });
          }
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
