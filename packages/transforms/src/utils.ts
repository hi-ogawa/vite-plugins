import { tinyassert } from "@hiogawa/utils";
import type { Program } from "estree";

export function hasDirective(
  body: Program["body"],
  directive: string,
): boolean {
  return !!body.find(
    (stmt) =>
      stmt.type === "ExpressionStatement" &&
      stmt.expression.type === "Literal" &&
      typeof stmt.expression.value === "string" &&
      stmt.expression.value === directive,
  );
}

export function getExportNames(
  ast: Program,
  options: {
    ignoreExportAllDeclaration?: boolean;
  },
) {
  const exportNames: string[] = [];

  for (const node of ast.body) {
    if (node.type === "ExportNamedDeclaration") {
      if (node.declaration) {
        if (
          node.declaration.type === "FunctionDeclaration" ||
          node.declaration.type === "ClassDeclaration"
        ) {
          /**
           * export function foo() {}
           */
          exportNames.push(node.declaration.id.name);
        } else if (node.declaration.type === "VariableDeclaration") {
          /**
           * export const foo = 1, bar = 2
           */
          for (const decl of node.declaration.declarations) {
            // TODO: support non identifier e.g.
            // export const { x } = { x: 0 }
            tinyassert(decl.id.type === "Identifier");
            exportNames.push(decl.id.name);
          }
        } else {
          node.declaration satisfies never;
        }
      } else {
        /**
         * export { foo, bar as car } from './foo'
         * export { foo, bar as car }
         */
        for (const spec of node.specifiers) {
          exportNames.push(spec.exported.name);
        }
      }
    }

    /**
     * export * from './foo'
     */
    if (
      !options.ignoreExportAllDeclaration &&
      node.type === "ExportAllDeclaration"
    ) {
      throw new Error("unsupported ExportAllDeclaration");
    }

    /**
     * export default function foo() {}
     * export default class Foo {}
     * export default () => {}
     */
    if (node.type === "ExportDefaultDeclaration") {
      exportNames.push("default");
    }
  }

  return { exportNames };
}
