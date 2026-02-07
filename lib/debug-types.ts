import ts from 'typescript';

const code = `
/** @type {string} */
const stringValue = String(42);

/** @type {number} */
const numValue = parseInt("42", 10);
`;

const fileName = 'test.js';
const compilerOptions: ts.CompilerOptions = {
  allowJs: true,
  checkJs: true,
  noEmit: true,
  strict: true,
};

const host = ts.createCompilerHost(compilerOptions);
const originalGetSourceFile = host.getSourceFile;
host.getSourceFile = (name, target) => {
  if (name === fileName) {
    return ts.createSourceFile(name, code, target, true, ts.ScriptKind.JS);
  }
  return originalGetSourceFile(name, target);
};

const program = ts.createProgram([fileName], compilerOptions, host);
const checker = program.getTypeChecker();
const sourceFile = program.getSourceFile(fileName);

if (sourceFile) {
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.initializer) {
          const varType = checker.getTypeAtLocation(decl.name);
          const initType = checker.getTypeAtLocation(decl.initializer);

          console.log('Variable:', decl.name.text);
          console.log('  Variable type:', checker.typeToString(varType));
          console.log('  Initializer type:', checker.typeToString(initType));
          console.log();
        }
      }
    }
  });
}
