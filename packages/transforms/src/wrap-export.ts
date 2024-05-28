import { tinyassert } from "@hiogawa/utils";
import type { Program } from "estree";
import MagicString from "magic-string";
import { extract_names } from "periscopic";

// TODO:
// needs to preserve reference? this would break everything....
//   export let count = 0;
//   ⇓
//   const $$wrap_count = $$wrap(count, ...);
//   export { $$wrap_count as count }

export async function transformWrapExport(
  input: string,
  ast: Program,
  options: {
    id: string;
    runtime: string;
    ignoreExportAllDeclaration?: boolean;
  },
) {
  const output = new MagicString(input);
  const exportNames: string[] = [];
  const toAppend: string[] = [];

  function wrapExport(name: string, exportName = name) {
    exportNames.push(exportName);
    toAppend.push(
      `const $$wrap_${name} = ${options.runtime}(${name}, "${options.id}", "${exportName}")`,
      `export { $$wrap_${name} as ${exportName} }`,
    );
  }

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
          // strip export
          output.remove(node.start, node.start + 6);
          wrapExport(node.declaration.id.name);
        } else if (node.declaration.type === "VariableDeclaration") {
          /**
           * export const foo = 1, bar = 2
           */
          output.remove(node.start, node.start + 6);
          for (const decl of node.declaration.declarations) {
            // TODO: support non identifier e.g.
            // export const { x } = { x: 0 }
            extract_names;

            tinyassert(decl.id.type === "Identifier");
            wrapExport(decl.id.name);
          }
        } else {
          node.declaration satisfies never;
        }
      } else {
        if (node.source) {
          /**
           * export { foo, bar as car } from './foo'
           */
          output.remove(node.start, node.end);
          for (const spec of node.specifiers) {
            const name = spec.local.name;
            toAppend.push(
              `import { ${name} as $$import_${name} } from ${node.source.raw}`,
            );
            wrapExport(`$$import_${name}`, spec.exported.name);
          }
        } else {
          /**
           * export { foo, bar as car }
           */
          output.remove(node.start, node.end);
          for (const spec of node.specifiers) {
            wrapExport(spec.local.name, spec.exported.name);
          }
        }
      }
    }

    /**
     * export * from './foo'
     */
    // vue sfc uses ExportAllDeclaration to re-export setup script.
    // for now we just give an option to not throw for this case.
    // https://github.com/vitejs/vite-plugin-vue/blob/30a97c1ddbdfb0e23b7dc14a1d2fb609668b9987/packages/plugin-vue/src/main.ts#L372
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
      let localName: string;
      if (
        (node.declaration.type === "FunctionDeclaration" ||
          node.declaration.type === "ClassDeclaration") &&
        node.declaration.id
      ) {
        // preserve name scope for `function foo() {}` and `class Foo {}`
        localName = node.declaration.id.name;
        output.remove(node.start, node.declaration.start);
      } else {
        // otherwise we can introduce new variable
        localName = "$$default";
        output.update(node.start, node.declaration.start, "const $$default = ");
      }
      wrapExport(localName, "default");
    }
  }

  if (toAppend.length > 0) {
    output.append(["", ...toAppend, ""].join(";\n"));
  }

  return { exportNames, output };
}
