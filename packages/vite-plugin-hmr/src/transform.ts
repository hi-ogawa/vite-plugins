import type { Node, Program } from "estree";
import type MagicString from "magic-string";

// traverse export declaration statements based on
// https://github.com/vitejs/vite/blob/fc2bceb09fb65cc6dc843462f51506586251a703/packages/vite/src/node/ssr/ssrTransform.ts#L172

declare module "estree" {
  interface BaseNode {
    start: number;
    end: number;
  }
}

export function analyzeExports(code: MagicString, ast: Program) {
  // extract exported top-level identifiers
  const exportIds: string[] = [];

  // unsupported export usage
  const errors: { node: Node }[] = [];

  for (const node of ast.body) {
    // named exports
    if (node.type === "ExportNamedDeclaration") {
      if (node.declaration) {
        if (
          node.declaration.type === "FunctionDeclaration" ||
          node.declaration.type === "ClassDeclaration"
        ) {
          /**
           * export function foo() {}
           */
          exportIds.push(node.declaration.id.name);
        } else if (node.declaration.type === "VariableDeclaration") {
          /**
           * export const foo = 1, bar = 2
           */
          if (node.declaration.kind === "const") {
            // rewrite from "const" to "let"
            code.remove(node.declaration.start, node.declaration.start + 5);
            code.appendLeft(node.declaration.start, "let");
          }
          for (const decl of node.declaration.declarations) {
            if (decl.id.type === "Identifier") {
              exportIds.push(decl.id.name);
            } else {
              errors.push({ node: decl });
            }
          }
        }
      } else {
        if (node.source) {
          /**
           * export { foo, bar } from './foo'
           */
        } else {
          /**
           * export { foo, bar }
           */
          // TODO: support by analyzing scope? or just rewrite all top level `const` into `let`?
          errors.push({ node });
        }
      }
    }

    // default export
    if (node.type === "ExportDefaultDeclaration") {
      if (
        (node.declaration.type === "FunctionDeclaration" ||
          node.declaration.type === "ClassExpression") &&
        node.declaration.id
      ) {
        /**
         * export default function foo() {}
         * export default class A {}
         */
        exportIds.push(node.declaration.id.name);
      } else {
        // anonymous default exports
        errors.push({ node });
      }
    }

    /**
     * export * from './foo'
     */
    if (node.type === "ExportAllDeclaration") {
    }
  }

  return { exportIds, errors };
}
