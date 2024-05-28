import type { Program } from "estree";
import MagicString from "magic-string";
import { extract_names } from "periscopic";

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

  function wrapSimple(name: string) {
    // preserve reference export
    toAppend.push(
      `${name} = ${options.runtime}(${name}, "${options.id}", "${name}")`,
      `export { ${name} }`,
    );
  }

  function wrapExport(name: string, exportName: string) {
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
          output.remove(node.start, node.declaration.start);
          wrapSimple(node.declaration.id.name);
        } else if (node.declaration.type === "VariableDeclaration") {
          /**
           * export const foo = 1, bar = 2
           */
          // strip export
          output.remove(node.start, node.declaration.start);
          // rewrite from "const" to "let"
          if (node.declaration.kind === "const") {
            output.update(
              node.declaration.start,
              node.declaration.start + 5,
              "let",
            );
          }
          for (const decl of node.declaration.declarations) {
            for (const name of extract_names(decl.id)) {
              wrapSimple(name);
            }
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
