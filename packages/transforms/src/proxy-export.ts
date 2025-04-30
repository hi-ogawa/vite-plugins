import { tinyassert } from "@hiogawa/utils";
import type { Node, Program } from "estree";
import MagicString from "magic-string";
import { extract_names } from "periscopic";
import { hasDirective } from "./utils";

export function transformDirectiveProxyExport(
  ast: Program,
  options: {
    directive: string;
    code?: string;
    runtime: (name: string) => string;
    ignoreExportAllDeclaration?: boolean;
  },
) {
  if (!hasDirective(ast.body, options.directive)) {
    return;
  }
  return transformProxyExport(ast, options);
}

export function transformProxyExport(
  ast: Program,
  options: {
    code?: string;
    runtime: (name: string) => string;
    ignoreExportAllDeclaration?: boolean;
  },
) {
  const output = new MagicString(options.code ?? " ".repeat(ast.end));
  const exportNames: string[] = [];

  function createExport(node: Node, names: string[]) {
    exportNames.push(...names);
    const newCode = names
      .map(
        (name) =>
          (name === "default" ? `export default` : `export const ${name} =`) +
          ` /* #__PURE__ */ ${options.runtime(name)};\n`,
      )
      .join("");
    output.update(node.start, node.end, newCode);
  }

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
          createExport(node, [node.declaration.id.name]);
        } else if (node.declaration.type === "VariableDeclaration") {
          /**
           * export const foo = 1, bar = 2
           */
          const names = node.declaration.declarations.flatMap((decl) =>
            extract_names(decl.id),
          );
          createExport(node, names);
        } else {
          node.declaration satisfies never;
        }
      } else {
        /**
         * export { foo, bar as car } from './foo'
         * export { foo, bar as car }
         */
        const names: string[] = [];
        for (const spec of node.specifiers) {
          tinyassert(spec.exported.type === "Identifier");
          names.push(spec.exported.name);
        }
        createExport(node, names);
      }
      continue;
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
      createExport(node, ["default"]);
      continue;
    }

    // remove all other nodes
    output.remove(node.start, node.end);
  }

  return { exportNames, output };
}
