import { Project, SyntaxKind } from "ts-morph";

export interface CodeChunkMap {
  chunkName: string;
  chunkType: string;
  content: string;
  startLine: number;
  endLine: number;
}

export interface FileMap {
  filePath: string;
  fileSha: string;
  imports: string[];
  exports: string[];
  calledBy: string[]; // placeholder for calledBy logic if needed
  chunks: CodeChunkMap[];
}

const project = new Project({
  useInMemoryFileSystem: true,
  compilerOptions: {
    allowJs: true,
  },
});

export function mapFile(filePath: string, content: string, fileSha: string): FileMap {
  const sourceFile = project.createSourceFile(filePath, content, { overwrite: true });

  const imports: string[] = [];
  sourceFile.getImportDeclarations().forEach((imp) => {
    imports.push(imp.getText());
  });

  const exports: string[] = [];
  sourceFile.getExportedDeclarations().forEach((decls, name) => {
    exports.push(name);
  });

  const chunks: CodeChunkMap[] = [];

  // 1. Functions
  sourceFile.getFunctions().forEach((func) => {
    chunks.push({
      chunkName: func.getName() || "anonymous_function",
      chunkType: "function",
      content: func.getText(),
      startLine: func.getStartLineNumber(),
      endLine: func.getEndLineNumber(),
    });
  });

  // 2. Classes
  sourceFile.getClasses().forEach((cls) => {
    chunks.push({
      chunkName: cls.getName() || "anonymous_class",
      chunkType: "class",
      content: cls.getText(),
      startLine: cls.getStartLineNumber(),
      endLine: cls.getEndLineNumber(),
    });
    
    // Method chunking (optional, but good for granularity, we'll keep whole classes for now according to prompt)
  });

  // 3. Interfaces
  sourceFile.getInterfaces().forEach((iface) => {
    chunks.push({
      chunkName: iface.getName(),
      chunkType: "interface",
      content: iface.getText(),
      startLine: iface.getStartLineNumber(),
      endLine: iface.getEndLineNumber(),
    });
  });

  // 4. Arrow functions assigned to variables
  sourceFile.getVariableStatements().forEach((varStmt) => {
    varStmt.getDeclarations().forEach((decl) => {
      const initializer = decl.getInitializer();
      if (
        initializer &&
        (initializer.getKind() === SyntaxKind.ArrowFunction ||
          initializer.getKind() === SyntaxKind.FunctionExpression)
      ) {
        chunks.push({
          chunkName: decl.getName(),
          chunkType: "function",
          content: varStmt.getText(), 
          startLine: decl.getStartLineNumber(),
          endLine: decl.getEndLineNumber(),
        });
      }
    });
  });

  return {
    filePath,
    fileSha,
    imports,
    exports: [...new Set(exports)],
    calledBy: [], // This would require cross-file analysis, leaving empty as placeholder
    chunks,
  };
}
