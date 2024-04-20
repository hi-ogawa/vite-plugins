import type { Program } from "estree";
import type MagicString from "magic-string";

// extend types for rollup ast with node position
declare module "estree" {
  interface BaseNode {
    start: number;
    end: number;
  }
}

// cf. https://github.com/hi-ogawa/vite-plugins/blob/aed20d88ae4b1582701795e2079a96d7caeccf89/packages/vite-plugin-simple-hmr/src/transform.ts#L73

export function getExportNames(
  ast: Program,
  {
    toWritable,
  }: {
    toWritable?: {
      code: MagicString;
    };
  } = {},
) {
  const exportNames = new Set<string>();
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
          exportNames.add(node.declaration.id.name);
        } else if (node.declaration.type === "VariableDeclaration") {
          /**
           * export const foo = 1, bar = 2
           */
          // replace "const" to "let"
          if (node.declaration.kind === "const" && toWritable) {
            toWritable.code.remove(
              node.declaration.start,
              node.declaration.start + 5,
            );
            toWritable.code.appendLeft(node.declaration.start, "let");
          }
          for (const decl of node.declaration.declarations) {
            if (decl.id.type === "Identifier") {
              exportNames.add(decl.id.name);
            } else {
              console.error(getExportNames.name, "unsupported code", decl);
            }
          }
        }
      } else {
        /**
         * export { foo, bar } from './foo'
         * export { foo, bar as car }
         */
        for (const spec of node.specifiers) {
          exportNames.add(spec.exported.name);
        }
        if (toWritable) {
          console.error(
            getExportNames.name,
            "(toWritable) unsupported code",
            node,
          );
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
        exportNames.add("default");
      } else {
        /**
         * export default () => {}
         */
        exportNames.add("default");
      }
      if (toWritable) {
        console.error(
          getExportNames.name,
          "(toWritable) unsupported code",
          node,
        );
      }
    }

    /**
     * export * from './foo'
     */
    if (node.type === "ExportAllDeclaration") {
      console.error("[collectExportNames]", "unsupported code", node);
    }
  }

  return exportNames;
}

export const USE_CLIENT_RE = /^("use client"|'use client')/;
export const USE_SERVER_RE = /^("use server"|'use server')/;
