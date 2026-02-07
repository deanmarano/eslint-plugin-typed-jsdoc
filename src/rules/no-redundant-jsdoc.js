/**
 * Rule: no-redundant-jsdoc
 *
 * Remove JSDoc types that TypeScript infers exactly.
 */

import { ESLintUtils } from '@typescript-eslint/utils';
import { getJSDocComment, parseJSDoc, getJSDocType, removeTag } from '../utils/jsdoc.js';
import { typesMatch, isTypeInteresting } from '../utils/type-comparison.js';
import { shouldIgnore, ignorePatternsSchema } from '../utils/ignore.js';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/estl/eslint-plugin-estl/blob/main/docs/rules/${name}.md`
);

/**
 * @typedef {object} RuleOptions
 * @property {boolean} [keepDescriptions]
 * @property {string[]} [ignorePatterns]
 */

/**
 * @typedef {'redundantType' | 'redundantJsdoc'} MessageIds
 */

export default createRule({
  name: 'no-redundant-jsdoc',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow JSDoc type annotations that match TypeScript inference exactly',
    },
    fixable: 'code',
    messages: {
      redundantType: "JSDoc @type '{{type}}' is redundant - TypeScript infers the same type",
      redundantJsdoc: 'JSDoc comment is redundant - only contains type information that TypeScript infers',
    },
    schema: [
      {
        type: 'object',
        properties: {
          keepDescriptions: {
            type: 'boolean',
            description: 'Keep JSDoc comments that have descriptions, only remove the type',
          },
          ignorePatterns: ignorePatternsSchema,
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ keepDescriptions: true, ignorePatterns: [] }],
  create(context, [options]) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    /**
     * @param {import('@typescript-eslint/utils').TSESTree.VariableDeclaration} node
     */
    function checkVariableDeclaration(node) {
      for (const declarator of node.declarations) {
        if (declarator.id.type !== 'Identifier') continue;
        if (!declarator.init) continue;

        // Check if variable should be ignored
        if (shouldIgnore(declarator.id.name, options.ignorePatterns || [])) continue;

        const jsdocComment = getJSDocComment(node, context.sourceCode);
        if (!jsdocComment) continue;

        const jsdoc = parseJSDoc(jsdocComment.value);
        const jsdocType = getJSDocType(jsdoc);
        if (!jsdocType) continue;

        // Get the type of the INITIALIZER, not the variable (which includes JSDoc influence)
        // This tells us what TypeScript would infer without the JSDoc
        const initTsNode = services.esTreeNodeToTSNodeMap.get(declarator.init);
        const inferredType = checker.getTypeAtLocation(initTsNode);
        const inferredString = checker.typeToString(inferredType);

        // Check if types match and the inferred type is "boring" (simple literal)
        if (typesMatch(jsdocType, inferredString) && !isTypeInteresting(inferredString)) {
          const hasDescription = jsdoc.description || jsdoc.tags.some((t) => t.description && t.tag !== 'type');

          if (hasDescription && options.keepDescriptions) {
            // Remove just the @type tag, keep the rest
            context.report({
              node,
              messageId: 'redundantType',
              data: { type: jsdocType },
              fix(fixer) {
                const newJsdoc = removeTag(jsdoc, 'type');
                if (newJsdoc) {
                  return fixer.replaceTextRange(
                    [jsdocComment.range[0], jsdocComment.range[1]],
                    newJsdoc
                  );
                }
                // If JSDoc would be empty, remove it entirely
                return fixer.removeRange([jsdocComment.range[0], jsdocComment.range[1] + 1]);
              },
            });
          } else {
            // Remove entire JSDoc
            context.report({
              node,
              messageId: 'redundantJsdoc',
              fix(fixer) {
                // Remove the entire JSDoc comment including trailing newline
                const sourceCode = context.sourceCode;
                const text = sourceCode.getText();
                let endPos = jsdocComment.range[1];

                // Skip whitespace and newline after comment
                while (endPos < text.length && (text[endPos] === ' ' || text[endPos] === '\t')) {
                  endPos++;
                }
                if (text[endPos] === '\n') {
                  endPos++;
                }

                return fixer.removeRange([jsdocComment.range[0], endPos]);
              },
            });
          }
        }
      }
    }

    return {
      VariableDeclaration: checkVariableDeclaration,
    };
  },
});
