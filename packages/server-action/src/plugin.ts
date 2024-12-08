import FastGlob from "fast-glob";
import MagicString from "magic-string";
import fs from "node:fs";
import { parseAstAsync, type Plugin, type PluginOption, type ResolvedConfig } from "vite";

const USE_SERVER_RE = /^("use server"|'use server')/;

export function vitePluginServerAction({
  clientRuntime,
  serverRuntime,
  entries,
}: {
  clientRuntime: string;
  serverRuntime: string;
  entries: string[],
}): PluginOption {
  let config: ResolvedConfig;

  const basePlugin: Plugin = {
    name: vitePluginServerAction.name + ":base",
    configResolved(config_) {
      config = config_;
    },
  }

  const transformPlugin: Plugin = {
    name: vitePluginServerAction.name + ":transform",
    async transform(code, id, options) {
      if (USE_SERVER_RE.test(code)) {
        const { writable, exportNames } = await parseExports(code)
        if (!options?.ssr) {
          const outCode = [
            `import { createServerReference as $$create } from "${clientRuntime}";`,
            ...[...exportNames].map(
              (name) => `export const ${name} = $$create("${id}", "${name}");`,
            ),
          ].join("\n");
          return { code: outCode, map: null };
        } else {
          const footer = [
            code,
            `import { registerServerReference as $$register } from "${serverRuntime}";`,
            ...[...exportNames].map(
              (name) => `${name} = $$register(${name}, "${id}", "${name}");`,
            ),
          ].join("\n");
          writable.append(footer);
          return { code: writable.toString(), map: writable.generateMap() };
        }
      }
      return;
    },
  };

  const virtualServerReference = createVirtualPlugin(
    "server-action/references",
    async function () {
      const files = await FastGlob(entries, {
        cwd: config.root,
        absolute: true,
      })
      const ids: string[] = [];
      for (const file of files) {
        const code = await fs.promises.readFile(file, "utf-8");
        if (USE_SERVER_RE.test(code)) {
          ids.push(file);
        }
      }
      return [
        "export default {",
        ...ids.map((id) => `"${id}": () => import("${id}"),\n`),
        "}",
      ].join("\n");
    },
  );

  return [
    basePlugin,
    transformPlugin,
    virtualServerReference,
    vitePluginSilenceDirectiveBuildWarning(),
  ];
}

function createVirtualPlugin(name: string, load: Plugin["load"]) {
  name = "virtual:" + name;
  return {
    name,
    resolveId(source, _importer, _options) {
      return source === name ? "\0" + name : undefined;
    },
    load(id, options) {
      if (id === "\0" + name) {
        return (load as any).apply(this, [id, options]);
      }
    },
  } satisfies Plugin;
}

function vitePluginSilenceDirectiveBuildWarning(): Plugin {
  return {
    name: vitePluginSilenceDirectiveBuildWarning.name,
    apply: "build",
    enforce: "post",
    config: (config, _env) => ({
      build: {
        rollupOptions: {
          onwarn(warning, defaultHandler) {
            if (
              warning.code === "SOURCEMAP_ERROR" &&
              warning.message.includes("(1:0)")
            ) {
              return;
            }
            if (
              warning.code === "MODULE_LEVEL_DIRECTIVE" &&
              (warning.message.includes(`"use client"`) ||
                warning.message.includes(`"use server"`))
            ) {
              return;
            }
            if (config.build?.rollupOptions?.onwarn) {
              config.build.rollupOptions.onwarn(warning, defaultHandler);
            } else {
              defaultHandler(warning);
            }
          },
        },
      },
    }),
  };
}

async function parseExports(code: string) {
  const ast = await parseAstAsync(code);
  const writable = new MagicString(code); // replace "const" with "let"
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
          if (node.declaration.kind === "const") {
            const { start } = node.declaration as any;
            writable.remove(start, start + 5);
            writable.appendLeft(start, "let");
          }
          for (const decl of node.declaration.declarations) {
            if (decl.id.type === "Identifier") {
              exportNames.add(decl.id.name);
            } else {
              console.error(parseExports.name, "unsupported code", decl);
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
    }

    /**
     * export * from './foo'
     */
    if (node.type === "ExportAllDeclaration") {
      console.error(parseExports.name, "unsupported code", node);
    }
  }

  return { exportNames, writable };
}
