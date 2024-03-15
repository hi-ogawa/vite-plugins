import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { tinyassert } from "@hiogawa/utils";
import type { Program } from "estree";
import fg from "fast-glob";
import MagicString from "magic-string";
import {
  type ConfigEnv,
  type InlineConfig,
  type Plugin,
  type PluginOption,
  type ViteDevServer,
  build,
  createServer,
  parseAstAsync,
} from "vite";
import { debug } from "../lib/debug";

const require = createRequire(import.meta.url);

// convenient singleton to track file ids to decide RSC hot reload
class RscManager {
  parentServer: ViteDevServer | undefined;

  // expose "use client" node modules to client via virtual modules
  // to avoid dual package due to deps optimization hash during dev
  nodeModules = {
    all: new Set<string>(),
    useClient: new Map<string, { id: string; exports: Set<string> }>(),
  };

  // all files in parent server
  parentIds = new Set<string>();
  // all files in rsc server
  rscIds = new Set<string>();
  // "use client" files in rsc server
  rscUseClientIds = new Set<string>();
  // "use server" files in rsc server
  rscUseServerIds = new Set<string>();

  shouldReloadRsc(id: string) {
    const ok = this.rscIds.has(id) && !this.rscUseClientIds.has(id);
    debug.plugin("[RscManager.shouldReloadRsc]", { ok, id });
    return ok;
  }
}

const RSC_ENTRY = "@hiogawa/react-server/entry-react-server";

export function vitePluginReactServer(options?: {
  plugins?: PluginOption[];
}): Plugin[] {
  let parentServer: ViteDevServer | undefined;
  let parentEnv: ConfigEnv;
  let rscDevServer: ViteDevServer | undefined;
  let manager = new RscManager();

  const rscConfig: InlineConfig = {
    // TODO: custom logger to distinct two server logs easily?
    // customLogger: undefined,
    clearScreen: false,
    configFile: false,
    cacheDir: "./node_modules/.vite-rsc",
    optimizeDeps: {
      noDiscovery: true,
      include: [],
    },
    ssr: {
      resolve: {
        conditions: ["react-server"],
      },
      // no external to ensure loading all deps with react-server condition
      noExternal: true,
      // pre-bundle cjs deps
      // TODO: need to crawl user's react 3rd party libs? (like svelte does?)
      optimizeDeps: {
        include: [
          "react",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
          "react-server-dom-webpack/server.edge",
          "@hiogawa/react-server/entry-react-server > react",
          "@hiogawa/react-server/entry-react-server > react/jsx-runtime",
          "@hiogawa/react-server/entry-react-server > react/jsx-dev-runtime",
          "@hiogawa/react-server/entry-react-server > react-server-dom-webpack/server.edge",
        ],
      },
    },
    plugins: [
      // expose server reference for RSC itself
      vitePluginServerUseServer(),

      // transform "use client" into client referecnes
      vitePluginServerUseClient({ manager }),

      // expose server references for RSC build via virtual module
      {
        name: "virtual-rsc-use-server",
        apply: "build",
        async buildStart(_options) {
          // we need to crawl file system to collect server references ("use server")
          // since we currently needs RSC -> Client -> SSR build pipeline
          // to collect client references first in RSC.
          // TODO: what if "use server" is provided from 3rd party library?
          const files = await fg("./src/**/*.(js|jsx|ts|tsx)", {
            absolute: true,
            ignore: ["**/node_modules/**"],
          });
          for (const file of files) {
            const data = await fs.promises.readFile(file, "utf-8");
            if (data.match(/^("use server")|('use server')/)) {
              manager.rscUseServerIds.add(file);
            }
          }
          debug.plugin("[virtual-rsc-use-server]", [
            ...manager.rscUseServerIds,
          ]);
        },
        resolveId(source, _importer, _options) {
          if (source === "virtual:rsc-use-server") {
            return "\0" + source;
          }
          return;
        },
        async load(id, _options) {
          if (id === "\0virtual:rsc-use-server") {
            let result = `export default {\n`;
            for (const id of manager.rscUseServerIds) {
              result += `"${id}": () => import("${id}"),\n`;
            }
            result += "};\n";
            return result;
          }
          return;
        },
      },

      // expose glob import for routs
      {
        name: "virtual-rsc-glob-routes",
        resolveId(source, _importer, _options) {
          if (source === "virtual:rsc-glob-routes") {
            return "\0" + source;
          }
          return;
        },
        async load(id, _options) {
          if (id === "\0virtual:rsc-glob-routes") {
            return /* js */ `
              export default import.meta.glob(
                "/src/routes/**/(page|layout).(js|jsx|ts|tsx)",
                {
                  eager: true,
                }
              )
            `;
          }
          return;
        },
      },

      ...(options?.plugins ?? []),
    ],
    build: {
      ssr: true,
      outDir: "dist/rsc",
      rollupOptions: {
        input: {
          index: RSC_ENTRY,
        },
      },
    },
  };

  const rscParentPlugin: Plugin = {
    name: vitePluginReactServer.name,
    config(_config, env) {
      parentEnv = env;
      return {
        optimizeDeps: {
          exclude: ["@hiogawa/react-server"],
          include: [
            "react",
            "react/jsx-runtime",
            "react/jsx-dev-runtime",
            "react-dom/client",
            "react-server-dom-webpack/client.browser",
          ],
        },
        ssr: {
          noExternal: ["@hiogawa/react-server"],
          optimizeDeps: {
            exclude: ["@hiogawa/react-server"],
          },
        },
        build: {
          outDir: env.isSsrBuild ? "dist/server" : "dist/client",
        },
      };
    },
    async configureServer(server) {
      parentServer = server;
      manager.parentServer = server;
    },
    async buildStart(_options) {
      if (parentEnv.command === "serve") {
        rscDevServer = await createServer(rscConfig);
        rscDevServer.pluginContainer.buildStart({});
        Object.assign(globalThis, {
          __devServer: parentServer,
          __rscDevServer: rscDevServer,
        });
      }
      if (parentEnv.command === "build" && !parentEnv.isSsrBuild) {
        await build(rscConfig);
      }
    },
    async buildEnd(_options) {
      if (parentEnv.command === "serve") {
        await rscDevServer?.close();
      }
    },
    transform(_code, id, _options) {
      if (!id.includes("/node_modules/")) {
        manager.parentIds.add(id);
      }
    },
    async handleHotUpdate(ctx) {
      tinyassert(parentServer);

      // re-render RSC with custom event
      if (ctx.modules.every((m) => m.id && manager.shouldReloadRsc(m.id))) {
        parentServer.hot.send({
          type: "custom",
          event: "rsc:update",
          data: {
            file: ctx.file,
          },
        });

        // Some rsc files are included in parent module graph
        // due to postcss creating dependency from style.css to all source files.
        // In this case, reload all importers (for css hmr),
        // and return empty modules to avoid full-reload
        if (ctx.modules.every((m) => m.id && !manager.parentIds.has(m.id))) {
          // in this case
          for (const m of ctx.modules) {
            for (const imod of m.importers) {
              await parentServer.reloadModule(imod);
            }
          }
          return [];
        }
      }
      return ctx.modules;
    },
    resolveId(source, _importer, _options) {
      // weird trick to silence import analysis error during dev
      // by pointing to a file which always exists
      if (
        parentEnv.command === "serve" &&
        source === "/dist/rsc/client-references.js"
      ) {
        return "/package.json";
      }
      return;
    },
  };

  return [
    rscParentPlugin,
    vitePluginClientUseServer({ manager }),
    {
      name: "client-virtual-use-client-node-modules",
      resolveId(source, _importer, _options) {
        if (source.startsWith("virtual:use-client-node-module/")) {
          return "\0" + source;
        }
        return;
      },
      load(id, _options) {
        if (id.startsWith("\0virtual:use-client-node-module/")) {
          const source = id.slice("\0virtual:use-client-node-module/".length);
          const meta = manager.nodeModules.useClient.get(source);
          tinyassert(meta);
          return `export { ${[...meta.exports].join(", ")} } from "${source}"`;
        }
        return;
      },
    },
  ];
}

// TODO: refactor ast utils

/*
transform "use client" directive

[input]
"use client"
export function Counter() {}

[output (rsc)]
import { createClientReference } from "/src/runtime/rsc"
export const Counter = createClientReference("<id>::Counter");
*/
function vitePluginServerUseClient({
  manager,
}: {
  manager: RscManager;
}): PluginOption {
  // intercept Vite's node resolve to virtualize "use client" in node_modules
  // TODO: expose same virtuals on client
  // TODO: refactor ast manipulation
  const pluginUseClientNodeModules: Plugin = {
    name: "server-virtual-use-client-node-modules",
    enforce: "pre", // "pre" to steal Vite's node resolve
    apply: "serve",
    async resolveId(source, importer, _options) {
      // quick check node module
      if (
        source[0] !== "." &&
        source[0] !== "/" &&
        !source.startsWith("virtual")
      ) {
        // cached result
        if (manager.nodeModules.useClient.has(source)) {
          return `\0virtual:use-client-node-module/${source}`;
        }
        if (manager.nodeModules.all.has(source)) {
          return;
        }
        const resolved = await this.resolve(source, importer, {
          skipSelf: true,
        });
        debug.plugin("[use-client-node-modules]", { source, resolved });
        if (resolved && resolved.id.includes("/node_modules/")) {
          const [id] = resolved.id.split("?v=");
          tinyassert(id);
          const code = await fs.promises.readFile(id!, "utf-8");
          if (code.match(/^("use client"|'use client')/)) {
            manager.nodeModules.useClient.set(source, {
              id,
              exports: new Set(),
            });
            return `\0virtual:use-client-node-module/${source}`;
          }
        }
      }
      return;
    },
    async load(id, _options) {
      if (id.startsWith("\0virtual:use-client-node-module/")) {
        const source = id.slice("\0virtual:use-client-node-module/".length);
        const meta = manager.nodeModules.useClient.get(source);
        tinyassert(meta);
        // assume transpiled so we can parse right away
        // TODO: refactor ast
        const code = await fs.promises.readFile(meta.id, "utf-8");
        const ast: Program = await parseAstAsync(code);
        const exportNames = meta.exports;
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
                for (const decl of node.declaration.declarations) {
                  if (decl.id.type === "Identifier") {
                    exportNames.add(decl.id.name);
                  } else {
                    console.error(
                      "[unsupported]",
                      vitePluginServerUseClient.name,
                      decl
                    );
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
              exportNames.add(node.declaration.id.name);
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
            console.error(
              "[unsupported]",
              vitePluginServerUseClient.name,
              node
            );
          }
        }
        // we need to transform to client reference directly
        // otherwise `soruce` will be resolved infinite recursively
        id = noramlizeClientReferenceId(id);
        let result = `import { createClientReference } from "${require.resolve(
          "@hiogawa/react-server/server-internal"
        )}";\n`;
        for (const name of exportNames) {
          result += `export const ${name} = createClientReference("${id}::${name}");\n`;
        }
        return result;
      }
      return;
    },
  };

  const pluginUseClientLocal: Plugin = {
    name: "use-client-local",
    async transform(code, id, _options) {
      manager.rscIds.add(id);
      manager.rscUseClientIds.delete(id);
      if (!code.includes("use client")) {
        return;
      }
      const ast: Program = await parseAstAsync(code);
      const hasUseClient = ast.body.some(
        (node) =>
          node.type === "ExpressionStatement" &&
          "directive" in node &&
          node.directive === "use client"
      );
      if (!hasUseClient) {
        return;
      }
      manager.rscUseClientIds.add(id);
      // for now only handle simple exports
      //   export function foo() {}
      //   export const foo = () => {}
      // cf. https://github.com/hi-ogawa/vite-plugins/blob/aed20d88ae4b1582701795e2079a96d7caeccf89/packages/vite-plugin-simple-hmr/src/transform.ts#L73
      const exportNames: string[] = [];
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
              exportNames.push(node.declaration.id.name);
            } else if (node.declaration.type === "VariableDeclaration") {
              /**
               * export const foo = 1, bar = 2
               */
              for (const decl of node.declaration.declarations) {
                if (decl.id.type === "Identifier") {
                  exportNames.push(decl.id.name);
                } else {
                  console.error(
                    "[unsupported]",
                    vitePluginServerUseClient.name,
                    decl
                  );
                }
              }
            }
          } else {
            /**
             * export { foo, bar } from './foo'
             * export { foo, bar as car }
             */
            for (const spec of node.specifiers) {
              exportNames.push(spec.exported.name);
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
            exportNames.push(node.declaration.id.name);
          } else {
            /**
             * export default () => {}
             */
            exportNames.push("default");
          }
        }

        /**
         * export * from './foo'
         */
        if (node.type === "ExportAllDeclaration") {
          console.error("[unsupported]", vitePluginServerUseClient.name, node);
        }
      }
      // normalize client reference during dev
      // to align with Vite's import analysis
      if (manager.parentServer) {
        id = noramlizeClientReferenceId(id);
      }
      debug.plugin(`[${vitePluginServerUseClient.name}:transform]`, {
        id,
        exportNames,
      });
      // TODO:
      // "@hiogawa/react-server/client" needs to self-reference
      // "@hiogawa/react-server/server-internal" due to "use client" transform
      // but presumably it's failing due to https://github.com/vitejs/vite/pull/16068
      // For now, we workaround it by manually calling require.resolve
      let result = `import { createClientReference } from "${require.resolve(
        "@hiogawa/react-server/server-internal"
      )}";\n`;
      for (const name of exportNames) {
        result += `export const ${name} = createClientReference("${id}::${name}");\n`;
      }
      return result;
    },

    /**
     * emit client-references as dynamic import map
     * TODO: re-export only used exports via virtual modules?
     * TODO: obfuscate "id" for production?
     *
     * export default {
     *   "some-file1": () => import("some-file1"),
     * }
     */
    writeBundle: {
      async handler(options, _bundle) {
        let result = `export default {\n`;
        for (let id of manager.rscUseClientIds) {
          // virtual module needs to be mapped back to the original form
          const to = id.startsWith("\0") ? id.slice(1) : id;
          result += `"${id}": () => import("${to}"),\n`;
        }
        result += "};\n";
        tinyassert(options.dir);
        await fs.promises.writeFile(
          path.join(options.dir, "client-references.js"),
          result
        );
      },
    },
  };
  return [pluginUseClientNodeModules, pluginUseClientLocal];
}

// Apply same noramlizaion as Vite's dev import analysis
// to avoid dual package with "/xyz" and "/@fs/xyz" for example.
// For now this tries to cover simple cases
// https://github.com/vitejs/vite/blob/0c0aeaeb3f12d2cdc3c47557da209416c8d48fb7/packages/vite/src/node/plugins/importAnalysis.ts#L327-L399
function noramlizeClientReferenceId(id: string) {
  const root = process.cwd(); // TODO: pass vite root config
  if (id.startsWith(root)) {
    id = id.slice(root.length);
  } else if (path.isAbsolute(id)) {
    id = "/@fs" + id;
  } else {
    // aka wrapId
    id = id.startsWith(`/@id`) ? id : `/@id/${id.replace("\0", "__x00__")}`;
  }
  return id;
}

/*
transform "use server" directive
TODO: include all "use server" files for rsc build

[input]
"use server"
export function hello() {}

[output] (client / ssr)
import { createServerReference } from "/src/runtime/shared"
export const hello = createServerReference("<id>::hello");
*/
function vitePluginClientUseServer({
  manager,
}: {
  manager: RscManager;
}): Plugin {
  let configEnv: ConfigEnv;

  return {
    name: vitePluginClientUseServer.name,
    config(_config, env) {
      configEnv = env;
    },
    async transform(code, id, _options) {
      if (!code.includes("use server")) {
        return;
      }
      const ast: Program = await parseAstAsync(code);
      const hasDirective = ast.body.some(
        (node) =>
          node.type === "ExpressionStatement" &&
          "directive" in node &&
          node.directive === "use server"
      );
      if (!hasDirective) {
        return;
      }
      const exportNames: string[] = [];
      for (const node of ast.body) {
        if (node.type === "ExportNamedDeclaration") {
          if (node.declaration) {
            if (node.declaration.type === "FunctionDeclaration") {
              exportNames.push(node.declaration.id.name);
            }
            if (node.declaration.type === "VariableDeclaration") {
              for (const decl of node.declaration.declarations) {
                if (decl.id.type === "Identifier") {
                  exportNames.push(decl.id.name);
                }
              }
            }
          }
        }
      }
      debug.plugin(`[${vitePluginClientUseServer.name}:transform]`, {
        id,
        exportNames,
      });
      // TODO
      // only rsc build and client build shares is built in the same process
      // so we cannot validate in ssr build
      if (configEnv.command === "build" && !configEnv.isSsrBuild) {
        tinyassert(
          manager.rscUseServerIds.has(id),
          `missing server references in RSC build: ${id}`
        );
      }
      let result = `import { createServerReference } from "${require.resolve(
        "@hiogawa/react-server/client-internal"
      )}";\n`;
      for (const name of exportNames) {
        result += `export const ${name} = createServerReference("${id}::${name}");\n`;
      }
      return result;
    },
  };
}

function vitePluginServerUseServer(): Plugin {
  return {
    name: vitePluginServerUseClient.name,
    async transform(code, id, _options) {
      if (!code.includes("use server")) {
        return;
      }
      // cf. https://github.com/hi-ogawa/vite-plugins/blob/5f8e6936fa12e1f7524891e3c1e2a21065d50250/packages/vite-plugin-simple-hmr/src/transform.ts#L73
      const ast: Program = await parseAstAsync(code);
      const mcode = new MagicString(code);
      const hasDirective = ast.body.some(
        (node) =>
          node.type === "ExpressionStatement" &&
          "directive" in node &&
          node.directive === "use server"
      );
      if (!hasDirective) {
        return;
      }
      const exportNames: string[] = [];
      for (const node of ast.body) {
        if (node.type === "ExportNamedDeclaration") {
          if (node.declaration) {
            if (node.declaration.type === "FunctionDeclaration") {
              exportNames.push(node.declaration.id.name);
            }
            if (node.declaration.type === "VariableDeclaration") {
              if (node.declaration.kind === "const") {
                // rewrite from "const" to "let"
                mcode.remove(
                  node.declaration.start,
                  node.declaration.start + 5
                );
                mcode.appendLeft(node.declaration.start, "let");
              }
              for (const decl of node.declaration.declarations) {
                if (decl.id.type === "Identifier") {
                  exportNames.push(decl.id.name);
                }
                tinyassert(false);
              }
            }
          }
        }
      }
      debug.plugin(`[${vitePluginServerUseServer.name}:transform]`, {
        id,
        exportNames,
      });
      mcode.prepend(
        `import { createServerReference } from "${require.resolve(
          "@hiogawa/react-server/server-internal"
        )}";\n`
      );
      for (const name of exportNames) {
        mcode.append(
          `${name} = createServerReference("${id}::${name}", ${name});\n`
        );
      }
      return {
        code: mcode.toString(),
        map: mcode.generateMap(),
      };
    },
  };
}

// extend types for rollup ast with node position
declare module "estree" {
  interface BaseNode {
    start: number;
    end: number;
  }
}
