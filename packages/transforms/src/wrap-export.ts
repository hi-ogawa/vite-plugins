import { tinyassert } from "@hiogawa/utils";
import type { Node, Program } from "estree";
import MagicString from "magic-string";
import { extract_names } from "periscopic";

export function transformWrapExport(
  input: string,
  ast: Program,
  options: {
    runtime: (value: string, name: string) => string;
    ignoreExportAllDeclaration?: boolean;
    rejectNonAsyncFunction?: boolean;
  },
) {
  const output = new MagicString(input);
  const exportNames: string[] = [];
  const toAppend: string[] = [];

  function wrapSimple(start: number, end: number, names: string[]) {
    // update code and move to preserve `registerServerReference` position
    // e.g.
    // input
    //   export async function f() {}
    //   ^^^^^^
    // output
    //   async function f() {}
    //   f = registerServerReference(f, ...)   << maps to original "export" token
    //   export { f }                          <<
    const newCode = names
      .map(
        (name) =>
          `${name} = /* #__PURE__ */ ${options.runtime(name, name)};\n` +
          `export { ${name} };\n`,
      )
      .join("");
    output.update(start, end, newCode);
    output.move(start, end, input.length);
  }

  function wrapExport(name: string, exportName: string) {
    toAppend.push(
      `const $$wrap_${name} = /* #__PURE__ */ ${options.runtime(name, exportName)}`,
      `export { $$wrap_${name} as ${exportName} }`,
    );
  }

  function validateNonAsyncFunction(node: Node, ok?: boolean) {
    if (options.rejectNonAsyncFunction && !ok) {
      throw Object.assign(new Error(`unsupported non async function`), {
        pos: node.start,
      });
    }
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
          validateNonAsyncFunction(
            node,
            node.declaration.type === "FunctionDeclaration" &&
              node.declaration.async,
          );
          wrapSimple(node.start, node.declaration.start, [
            node.declaration.id.name,
          ]);
        } else if (node.declaration.type === "VariableDeclaration") {
          /**
           * export const foo = 1, bar = 2
           */
          validateNonAsyncFunction(
            node,
            node.declaration.declarations.every(
              (decl) =>
                decl.init?.type === "ArrowFunctionExpression" &&
                decl.init.async,
            ),
          );
          if (node.declaration.kind === "const") {
            output.update(
              node.declaration.start,
              node.declaration.start + 5,
              "let",
            );
          }
          const names = node.declaration.declarations.flatMap((decl) =>
            extract_names(decl.id),
          );
          wrapSimple(node.start, node.declaration.start, names);
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
            tinyassert(spec.local.type === "Identifier");
            tinyassert(spec.exported.type === "Identifier");
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
            tinyassert(spec.local.type === "Identifier");
            tinyassert(spec.exported.type === "Identifier");
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
      throw Object.assign(new Error("unsupported ExportAllDeclaration"), {
        pos: node.start,
      });
    }

    /**
     * export default function foo() {}
     * export default class Foo {}
     * export default () => {}
     */
    if (node.type === "ExportDefaultDeclaration") {
      validateNonAsyncFunction(
        node,
        // TODO: somehow identifier is allowed in next.js?
        // (see packages/react-server/examples/next/app/actions/server/actions.ts)
        node.declaration.type === "Identifier" ||
          (node.declaration.type === "FunctionDeclaration" &&
            node.declaration.async),
      );
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
