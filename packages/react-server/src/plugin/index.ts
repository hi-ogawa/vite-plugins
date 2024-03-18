import nodeCrypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { memoize, tinyassert } from "@hiogawa/utils";
import type { Program } from "estree";
import fg from "fast-glob";
import MagicString from "magic-string";
import {
  type ConfigEnv,
  type InlineConfig,
  type Manifest,
  type Plugin,
  type PluginOption,
  type ViteDevServer,
  build,
  createServer,
  parseAstAsync,
} from "vite";
import { debug } from "../lib/debug";
import { USE_CLIENT_RE, USE_SERVER_RE, getExportNames } from "./ast-utils";
import { collectStyle } from "./css";
import { invalidateModule } from "./utils";

const require = createRequire(import.meta.url);

// convenient singleton to share states
class ReactServerManager {
  buildType?: "rsc" | "client" | "ssr";

  // expose "use client" node modules to client via virtual modules
  // to avoid dual package due to deps optimization hash during dev
  nodeModules = {
    useClient: new Map<string, { id: string; exportNames: Set<string> }>(),
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

export function vitePluginReactServer(options?: {
  /**
   * @default "@hiogawa/react-server/entry-react-server"
   */
  entry?: string;
  plugins?: PluginOption[];
}): Plugin[] {
  const rscEntry = options?.entry ?? "@hiogawa/react-server/entry-react-server";
  const manager = new ReactServerManager();
  let parentServer: ViteDevServer | undefined;
  let parentEnv: ConfigEnv;
  let rscDevServer: ViteDevServer | undefined;

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
      // TODO: but probably users should be able to exclude
      //       node builtin or non-react related dependencies.
      noExternal: true,
      // pre-bundle cjs deps
      // TODO: should crawl user's cjs react 3rd party libs? (like svelte does?)
      optimizeDeps: {
        include: [
          "react",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
          "react-server-dom-webpack/server.edge",
        ],
      },
    },
    plugins: [
      // expose server reference for RSC itself
      vitePluginServerUseServer({ manager }),

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
              let key = manager.buildType ? hashString(id) : id;
              result += `"${key}": () => import("${id}"),\n`;
            }
            result += "};\n";
            return result;
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
          index: rscEntry,
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
          manifest: true,
          outDir: env.isSsrBuild ? "dist/server" : "dist/client",
          rollupOptions: env.isSsrBuild
            ? undefined
            : {
                input: "/src/entry-client",
              },
        },
      };
    },
    async configureServer(server) {
      parentServer = server;
    },
    async buildStart(_options) {
      if (parentEnv.command === "serve") {
        rscDevServer = await createServer(rscConfig);
        rscDevServer.pluginContainer.buildStart({});
        Object.assign(globalThis, {
          __devServer: parentServer,
          __rscDevServer: rscDevServer,
          __rscEntry: rscEntry,
        });
      }
      if (parentEnv.command === "build") {
        if (parentEnv.isSsrBuild) {
          manager.buildType = "ssr";
        } else {
          manager.buildType = "rsc";
          await build(rscConfig);
          manager.buildType = "client";
        }
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
          debug.plugin("[parent.use-client-node-modules]", { source, meta });
          tinyassert(meta);
          return `export {${[...meta.exportNames].join(
            ", ",
          )}} from "${source}"`;
        }
        return;
      },
    },
    {
      name: "virtual-client-bootstrap",
      resolveId(source, _importer, _options) {
        if (source.startsWith("virtual:client-bootstrap")) {
          return "\0" + source;
        }
        return;
      },
      async load(id, _options) {
        if (id === "\0virtual:client-bootstrap/dev") {
          tinyassert(!manager.buildType);
          // TODO
          // we should extract <head> from ViteDevServer.transformIndexHtml.
          // for now, we hard code known dev scripts.
          return /* js */ `
            import RefreshRuntime from "/@react-refresh";
            RefreshRuntime.injectIntoGlobalHook(window);
            window.$RefreshReg$ = () => {};
            window.$RefreshSig$ = () => (type) => type;
            window.__vite_plugin_react_preamble_installed__ = true;

            // dynamic import to avoid hoist
            await import("/@vite/client");
            await import("/src/entry-client.tsx");
          `;
        }
        if (id === "\0virtual:client-bootstrap/build") {
          tinyassert(manager.buildType === "ssr");
          const manifest: Manifest = JSON.parse(
            await fs.promises.readFile(
              "dist/client/.vite/manifest.json",
              "utf-8",
            ),
          );
          const entry = manifest["src/entry-client.tsx"];
          tinyassert(entry);
          return `export default "/${entry.file}";`;
        }
        return;
      },
    },
    {
      name: "virtual-ssr-head",
      resolveId(source, _importer, _options) {
        if (source.startsWith("virtual:ssr-head")) {
          return "\0" + source;
        }
        return;
      },
      async load(id, _options) {
        if (id === "\0virtual:ssr-head/dev") {
          tinyassert(!manager.buildType);
          // extract <head> injected by plugins
          const html = await __devServer.transformIndexHtml(
            "/",
            "<html><head></head></html>",
          );
          const match = html.match(/<head>(.*)<\/head>/s);
          tinyassert(match && 1 in match);
          let head = match[1];

          // server dev css as ?direct so that ssr html won't get too huge.
          // also remove style on first hot update.
          invalidateModule(__devServer, "\0virtual:ssr-css/dev.css?direct");
          head += `\
            <link data-ssr-css-dev rel="stylesheet" href="/@id/__x00__virtual:ssr-css/dev.css?direct" />
            <script type="module">
              import { createHotContext } from "/@vite/client";
              const hot = createHotContext("hot-data-ssr-css-dev");
              hot.on("vite:afterUpdate", () => {
                document
                  .querySelectorAll("[data-ssr-css-dev]")
                  .forEach(node => node.remove());
              });
            </script>
          `;

          return `export default ${JSON.stringify(head)}`;
        }
        if (id === "\0virtual:ssr-head/build") {
          tinyassert(manager.buildType === "ssr");
          // todo;
        }
        return;
      },
    },
    {
      name: "virtual-ssr-css",
      resolveId(source, _importer, _options) {
        if (source.startsWith("virtual:ssr-css")) {
          return "\0" + source;
        }
        return;
      },
      async load(id, _options) {
        if (id === "\0virtual:ssr-css/dev.css?direct") {
          tinyassert(!manager.buildType);
          // collect style in the server to fix dev FOUC
          const style = await collectStyle(__devServer, ["/src/entry-client"]);
          return style;
        }
        if (id === "\0virtual:ssr-css/build") {
          tinyassert(manager.buildType === "ssr");
          const manifest: Manifest = JSON.parse(
            await fs.promises.readFile(
              "dist/client/.vite/manifest.json",
              "utf-8",
            ),
          );
          const entry = manifest["src/entry-client.tsx"];
          tinyassert(entry);
          const head = (entry.css ?? [])
            .map((url) => `<link rel="stylesheet" href="/${url}" />`)
            .join("");
          return `export default ${JSON.stringify(head)}`;
        }
        return;
      },
    },
  ];
}

/*
transform "use client" directive on react server code

[input]
"use client"
export function Counter() {}

[output]
import { createClientReference } from "/src/runtime/rsc"
export const Counter = createClientReference("<id>::Counter");
*/
function vitePluginServerUseClient({
  manager,
}: {
  manager: ReactServerManager;
}): PluginOption {
  // intercept Vite's node resolve to virtualize "use client" in node_modules
  const pluginUseClientNodeModules: Plugin = {
    name: "server-virtual-use-client-node-modules",
    enforce: "pre", // "pre" to steal Vite's node resolve
    apply: "serve",
    resolveId: memoize(async function (this, source, importer) {
      if (
        source[0] !== "." &&
        source[0] !== "/" &&
        !source.startsWith("virtual") &&
        !source.startsWith("\0virtual")
      ) {
        const resolved = await this.resolve(source, importer, {
          skipSelf: true,
        });
        debug.plugin("[rsc.use-client-node-modules.resolveId]", {
          source,
          resolved,
        });
        if (resolved && resolved.id.includes("/node_modules/")) {
          const [id] = resolved.id.split("?v=");
          tinyassert(id);
          const code = await fs.promises.readFile(id!, "utf-8");
          if (code.match(USE_CLIENT_RE)) {
            manager.nodeModules.useClient.set(source, {
              id,
              exportNames: new Set(),
            });
            return `\0virtual:use-client-node-module/${source}`;
          }
        }
        return;
      }
      return;
    } satisfies Plugin["resolveId"]),
    async load(id, _options) {
      if (id.startsWith("\0virtual:use-client-node-module/")) {
        const source = id.slice("\0virtual:use-client-node-module/".length);
        const meta = manager.nodeModules.useClient.get(source);
        tinyassert(meta);
        // node_modules is already transpiled so we can parse it right away
        const code = await fs.promises.readFile(meta.id, "utf-8");
        const ast = await parseAstAsync(code);
        const exportNames = getExportNames(ast);
        meta.exportNames = exportNames;
        // we need to transform to client reference directly
        // otherwise `soruce` will be resolved infinitely by recursion
        id = noramlizeClientReferenceId(id);
        let result = `import { createClientReference } from "${require.resolve(
          "@hiogawa/react-server/server-internal",
        )}";\n`;
        for (const name of exportNames) {
          if (name === "default") {
            result += `const $$default = createClientReference("${id}::${name}");\n`;
            result += `export default $$default;\n`;
          } else {
            result += `export const ${name} = createClientReference("${id}::${name}");\n`;
          }
        }
        debug.plugin("[rsc.use-client-node-modules.load]", {
          source,
          meta,
          id,
          result,
        });
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
      if (!code.match(USE_CLIENT_RE)) {
        return;
      }
      const ast = await parseAstAsync(code);
      const exportNames = getExportNames(ast);
      manager.rscUseClientIds.add(id);
      // normalize client reference during dev
      // to align with Vite's import analysis
      if (!manager.buildType) {
        id = noramlizeClientReferenceId(id);
      } else {
        // obfuscate reference
        id = hashString(id);
      }
      // TODO:
      // "@hiogawa/react-server/client" needs to self-reference
      // "@hiogawa/react-server/server-internal" due to "use client" transform
      // but presumably it's failing due to https://github.com/vitejs/vite/pull/16068
      // For now, we workaround it by manually calling require.resolve
      let result = `import { createClientReference } from "${require.resolve(
        "@hiogawa/react-server/server-internal",
      )}";\n`;
      for (const name of exportNames) {
        if (name === "default") {
          result += `const $$default = createClientReference("${id}::${name}");\n`;
          result += `export default $$default;\n`;
        } else {
          result += `export const ${name} = createClientReference("${id}::${name}");\n`;
        }
      }
      debug.plugin(`[${vitePluginServerUseClient.name}:transform]`, {
        id,
        exportNames,
        result,
      });
      return result;
    },

    /**
     * emit client-references as dynamic import map
     * TODO: re-export only used exports via virtual modules?
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
          if (manager.buildType) {
            id = hashString(id);
          }
          result += `"${id}": () => import("${to}"),\n`;
        }
        result += "};\n";
        tinyassert(options.dir);
        await fs.promises.writeFile(
          path.join(options.dir, "client-references.js"),
          result,
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
  manager: ReactServerManager;
}): Plugin {
  return {
    name: vitePluginClientUseServer.name,
    async transform(code, id, _options) {
      if (!code.match(USE_SERVER_RE)) {
        return;
      }
      const ast = await parseAstAsync(code);
      const exportNames = getExportNames(ast);
      debug.plugin(`[${vitePluginClientUseServer.name}:transform]`, {
        id,
        exportNames,
      });
      // validate server reference used by client is properly generated in rsc build
      if (manager.buildType === "client") {
        tinyassert(
          manager.rscUseServerIds.has(id),
          `missing server references in RSC build: ${id}`,
        );
      }
      // obfuscate reference
      if (manager.buildType) {
        id = hashString(id);
      }
      let result = `import { createServerReference } from "${require.resolve(
        "@hiogawa/react-server/client-internal",
      )}";\n`;
      for (const name of exportNames) {
        if (name === "default") {
          result += `const $$default = createServerReference("${id}::${name}");\n`;
          result += `export default $$default;\n`;
        } else {
          result += `export const ${name} = createServerReference("${id}::${name}");\n`;
        }
      }
      return result;
    },
  };
}

function vitePluginServerUseServer({
  manager,
}: {
  manager: ReactServerManager;
}): Plugin {
  return {
    name: vitePluginServerUseClient.name,
    async transform(code, id, _options) {
      if (!code.match(USE_SERVER_RE)) {
        return;
      }
      // cf. https://github.com/hi-ogawa/vite-plugins/blob/5f8e6936fa12e1f7524891e3c1e2a21065d50250/packages/vite-plugin-simple-hmr/src/transform.ts#L73
      const ast: Program = await parseAstAsync(code);
      const mcode = new MagicString(code);
      const exportNames = getExportNames(ast, { toWritable: { code: mcode } });
      debug.plugin(`[${vitePluginServerUseServer.name}:transform]`, {
        id,
        exportNames,
      });
      mcode.prepend(
        `import { createServerReference } from "${require.resolve(
          "@hiogawa/react-server/server-internal",
        )}";\n`,
      );
      // obfuscate reference
      if (manager.buildType) {
        id = hashString(id);
      }
      for (const name of exportNames) {
        mcode.append(
          `${name} = createServerReference("${id}::${name}", ${name});\n`,
        );
      }
      return {
        code: mcode.toString(),
        map: mcode.generateMap(),
      };
    },
  };
}

function hashString(v: string) {
  return nodeCrypto
    .createHash("sha256")
    .update(v)
    .digest()
    .toString("base64url");
}
