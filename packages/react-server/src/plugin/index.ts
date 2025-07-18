import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDebug, tinyassert, uniq } from "@hiogawa/utils";
import {
  type ConfigEnv,
  type Plugin,
  type ResolvedConfig,
  type ViteDevServer,
  build,
  createBuilder,
  createServerModuleRunner,
  defaultServerConditions,
  isCSSRequest,
} from "vite";
import { crawlFrameworkPkgs } from "vitefu";
import {
  serverAssetsPluginServer,
  vitePluginServerAssets,
} from "../features/assets/plugin";
import { SERVER_CSS_PROXY } from "../features/assets/shared";
import {
  vitePluginClientUseClient,
  vitePluginServerUseClient,
} from "../features/client-component/plugin";
import {
  OUTPUT_SERVER_JS_EXT,
  createServerPackageJson,
} from "../features/next/plugin";
import {
  type PrerenderFn,
  type PrerenderManifest,
  prerenderPlugin,
} from "../features/prerender/plugin";
import type { RouteManifest } from "../features/router/manifest";
import {
  routeManifestPluginClient,
  routeManifestPluginServer,
} from "../features/router/plugin";
import {
  vitePluginClientUseServer,
  vitePluginServerUseServer,
} from "../features/server-action/plugin";
import { $__global } from "../global";
import {
  ENTRY_BROWSER_WRAPPER,
  ENTRY_SERVER_WRAPPER,
  createVirtualPlugin,
  hashString,
  wrapClientPlugin,
  wrapServerPlugin,
} from "./utils";
export { wrapClientPlugin, wrapServerPlugin } from "./utils";
import rscCore from "@hiogawa/vite-rsc/core/plugin";
import { vitePluginFindSourceMapURL } from "@hiogawa/vite-rsc/plugin";

const debug = createDebug("react-server:plugin");

// resolve import paths for `createClientReference`, `createServerReference`, etc...
// since `import "@hiogawa/react-server"` is not always visible for exernal library.
const RUNTIME_BROWSER_PATH = fileURLToPath(
  new URL("../runtime/browser.js", import.meta.url),
);
const RUNTIME_SSR_PATH = fileURLToPath(
  new URL("../runtime/ssr.js", import.meta.url),
);
const RUNTIME_SERVER_PATH = fileURLToPath(
  new URL("../runtime/server.js", import.meta.url),
);

export type { PrerenderManifest };

// convenient singleton to share states
export type { PluginStateManager };

class PluginStateManager {
  server?: ViteDevServer;
  config!: ResolvedConfig;
  configEnv!: ConfigEnv;

  outDir!: string;

  buildType?: "scan" | "server" | "browser" | "ssr";

  routeToClientReferences: Record<string, string[]> = {};
  routeManifest?: RouteManifest;
  serverAssets: string[] = [];
  prepareDestinationManifest?: Record<string, string[]> = {};

  // expose "use client" node modules to client via virtual modules
  // to avoid dual package due to deps optimization hash during dev
  nodeModules = {
    useClient: new Map<string, { id: string; exportNames: Set<string> }>(),
  };

  // all files in parent server
  parentIds = new Set<string>();
  // all files in rsc server
  serverIds = new Set<string>();
  // "use client" files
  clientReferenceMap = new Map<string, string>();

  // "use server" files
  serverReferenceMap = new Map<string, string>();

  shouldReloadRsc(id: string) {
    const ok = this.serverIds.has(id) && !this.clientReferenceMap.has(id);
    debug("[RscManager.shouldReloadRsc]", { ok, id });
    return ok;
  }

  normalizeReferenceId(id: string) {
    id = path.relative(this.config.root, id);
    return this.buildType ? hashString(id) : id;
  }
}

// persist singleton during build
if (!process.argv.includes("build")) {
  delete (globalThis as any).__VITE_REACT_SERVER_MANAGER;
}
const manager: PluginStateManager = ((
  globalThis as any
).__VITE_REACT_SERVER_MANAGER ??= new PluginStateManager());

export type ReactServerPluginOptions = {
  prerender?: PrerenderFn;
  entryBrowser?: string;
  entryServer?: string;
  routeDir?: string;
  outDir?: string;
  noAsyncLocalStorage?: boolean;
};

export function vitePluginReactServer(
  options?: ReactServerPluginOptions,
): Plugin[] {
  const entryBrowser =
    options?.entryBrowser ?? "@hiogawa/react-server/entry/browser";
  const entryServer =
    options?.entryServer ?? "@hiogawa/react-server/entry/server";
  const routeDir = options?.routeDir ?? "src/routes";
  const outDir = options?.outDir ?? "dist";

  const rscParentPlugin: Plugin = {
    name: vitePluginReactServer.name,
    config(_config, env) {
      manager.configEnv = env;
      return {
        optimizeDeps: {
          // this can potentially include unnecessary server only deps for client,
          // but there should be no issues except making deps optimization slightly slower.
          entries: [
            path.posix.join(
              routeDir,
              `**/(page|layout|error|not-found|loading|template).(js|jsx|ts|tsx)`,
            ),
          ],
          exclude: ["@hiogawa/react-server"],
          include: [
            "react",
            "react/jsx-runtime",
            "react/jsx-dev-runtime",
            "react-dom",
            "react-dom/client",
            "@hiogawa/react-server > @hiogawa/vite-rsc/react/browser",
          ],
        },
        build: {
          manifest: true,
          outDir: path.join(outDir, env.isSsrBuild ? "server" : "client"),
          rollupOptions: env.isSsrBuild
            ? {
                input: options?.prerender
                  ? {
                      __entry_ssr: "@hiogawa/react-server/entry/ssr",
                    }
                  : undefined,
                output: OUTPUT_SERVER_JS_EXT,
              }
            : {
                input: ENTRY_BROWSER_WRAPPER,
              },
        },
        environments: {
          rsc: {
            resolve: {
              conditions: ["react-server", ...defaultServerConditions],
            },
            build: {
              outDir: path.join(outDir, "rsc"),
              sourcemap: true,
              ssr: true,
              emitAssets: true,
              manifest: true,
              rollupOptions: {
                input: {
                  index: ENTRY_SERVER_WRAPPER,
                },
                output: OUTPUT_SERVER_JS_EXT,
              },
            },
          },
        },
      };
    },
    configResolved(config) {
      manager.config = config;
      manager.outDir = outDir;
    },
    async configureServer(server) {
      manager.server = server;
    },
    async buildStart(_options) {
      if (manager.configEnv.command === "serve") {
        tinyassert(manager.server);
        const reactServerEnv = manager.server.environments["rsc"];
        tinyassert(reactServerEnv);
        const reactServerRunner = createServerModuleRunner(reactServerEnv, {
          hmr: false,
        });
        $__global.dev = {
          server: manager.server,
          reactServerRunner,
          manager,
        };
      }
    },
    async buildEnd(_options) {
      if (manager.configEnv.command === "serve") {
        delete ($__global as any).dev;
      }
    },
    transform(_code, id, _options) {
      if (!id.includes("/node_modules/")) {
        manager.parentIds.add(id);
      }
    },
    async hotUpdate(ctx) {
      const isClientReference = ctx.modules.every(
        (mod) => mod.id && manager.clientReferenceMap.has(mod.id),
      );

      if (this.environment.name === "rsc") {
        // client reference id is also in react server module graph,
        // but we skip RSC HMR for this case to avoid conflicting with Client HMR.
        if (ctx.modules.length > 0 && !isClientReference) {
          $__global.dev.server.environments.client.hot.send({
            type: "custom",
            event: "rsc:update",
            data: {
              file: ctx.file,
            },
          });
        }
      }

      if (this.environment.name === "client") {
        // css module is not self-accepting, so we filter out
        // `?direct` module (used for SSR CSS) to avoid browser full reload.
        // (see packages/react-server/src/features/assets/css.ts)
        if (isCSSRequest(ctx.file)) {
          return ctx.modules.filter((m) => !m.id?.includes("?direct"));
        }

        // Server files can be included in client module graph
        // due to postcss creating dependencies from style.css to all source files.
        // In this case, reload all importers (for css hmr),
        // and return empty modules to avoid full-reload
        const reactServerEnv = $__global.dev.server.environments["rsc"]!;
        if (
          !isClientReference &&
          reactServerEnv.moduleGraph.getModulesByFile(ctx.file)
        ) {
          const importers = ctx.modules.flatMap((m) => [...m.importers]);
          if (
            importers.length > 0 &&
            importers.every((m) => m.id && isCSSRequest(m.id))
          ) {
            for (const m of importers) {
              await this.environment.reloadModule(m);
            }
            return [];
          }
        }
      }

      return;
    },
  };

  // orchestrate four builds from a single vite (browser) build
  const buildOrchestrationPlugin: Plugin = {
    name: vitePluginReactServer.name + ":build",
    apply: "build",
    async buildStart(_options) {
      if (!manager.buildType) {
        await createServerPackageJson(manager.outDir);
        console.log("▶▶▶ REACT SERVER BUILD (scan) [1/4]");
        manager.buildType = "scan";
        const builder = await createBuilder();
        builder.environments["rsc"]!.config.build.write = false;
        await builder.build(builder.environments["rsc"]!);
        console.log("▶▶▶ REACT SERVER BUILD (server) [2/4]");
        manager.buildType = "server";
        manager.clientReferenceMap.clear();
        builder.environments["rsc"]!.config.build.write = true;
        await builder.build(builder.environments["rsc"]!);
        console.log("▶▶▶ REACT SERVER BUILD (browser) [3/4]");
        manager.buildType = "browser";
      }
    },
    writeBundle: {
      order: "post",
      sequential: true,
      async handler(_options, _bundle) {
        if (manager.buildType === "browser") {
          console.log("▶▶▶ REACT SERVER BUILD (ssr) [4/4]");
          manager.buildType = "ssr";
          await build({
            build: {
              ssr: true,
            },
          });
        }
      },
    },
  };

  // plugins for main vite dev server (browser / ssr)
  return [
    ...rscCore(),
    ...vitePluginFindSourceMapURL(),
    rscParentPlugin,
    buildOrchestrationPlugin,

    //
    // react server
    //
    ...vitePluginServerUseServer({
      manager,
      runtimePath: RUNTIME_SERVER_PATH,
    }),
    ...vitePluginServerUseClient({
      manager,
      runtimePath: RUNTIME_SERVER_PATH,
    }),
    ...routeManifestPluginServer({ manager, routeDir }),
    createVirtualPlugin("server-routes", () => {
      return `
        const glob = import.meta.glob(
          "/${routeDir}/**/(page|layout|error|not-found|loading|template|route).(js|jsx|ts|tsx|md|mdx)",
          { eager: true },
        );
        export default Object.fromEntries(
          Object.entries(glob).map(
            ([k, v]) => [k.slice("/${routeDir}".length), v]
          )
        );

        const globMiddleware = import.meta.glob("/middleware.(js|jsx|ts|tsx)", { eager: true });
        export const middleware = Object.values(globMiddleware)[0];
      `;
    }),
    createVirtualPlugin(
      ENTRY_SERVER_WRAPPER.slice("virtual:".length),
      () => `
        export { handler } from "${entryServer}";
        export { router } from "@hiogawa/react-server/entry/server";
      `,
    ),
    {
      // make `AsyncLocalStorage` available globally for React request context on edge build (e.g. React.cache, ssr preload)
      // https://github.com/facebook/react/blob/f14d7f0d2597ea25da12bcf97772e8803f2a394c/packages/react-server/src/forks/ReactFlightServerConfig.dom-edge.js#L16-L19
      name: "inject-async-local-storage",
      async configureServer() {
        if (options?.noAsyncLocalStorage) return;

        const __viteRscAyncHooks = await import("node:async_hooks");
        (globalThis as any).AsyncLocalStorage =
          __viteRscAyncHooks.AsyncLocalStorage;
      },
      banner(chunk) {
        if (options?.noAsyncLocalStorage) return "";

        if (
          (this.environment.name === "ssr" ||
            this.environment.name === "rsc") &&
          this.environment.mode === "build" &&
          chunk.isEntry
        ) {
          return `\
            import * as __viteRscAyncHooks from "node:async_hooks";
            globalThis.AsyncLocalStorage = __viteRscAyncHooks.AsyncLocalStorage;
          `;
        }
        return "";
      },
    },
    wrapServerPlugin(
      validateImportPlugin({
        "client-only": `'client-only' is included in server build`,
        "server-only": true,
      }),
    ),
    ...serverAssetsPluginServer({ manager }),
    serverDepsConfigPlugin(),

    //
    // react client
    //

    vitePluginClientUseServer({
      manager,
      runtimePath: RUNTIME_BROWSER_PATH,
      ssrRuntimePath: RUNTIME_SSR_PATH,
    }),
    ...vitePluginClientUseClient({ manager }),
    ...vitePluginServerAssets({ manager, entryBrowser, entryServer }),
    ...routeManifestPluginClient({ manager }),
    ...(options?.prerender
      ? prerenderPlugin({ manager, prerender: options.prerender })
      : []),
    wrapClientPlugin(
      validateImportPlugin({
        "client-only": true,
        "server-only": `'server-only' is included in client build`,
      }),
    ),
    {
      // externalize `dist/rsc/index.js` import as relative path in ssr build
      name: "virtual:react-server-build",
      resolveId(source) {
        if (source === "virtual:react-server-build") {
          return { id: "__VIRTUAL_REACT_SERVER_BUILD__", external: true };
        }
        return;
      },
      renderChunk(code, chunk) {
        if (code.includes("__VIRTUAL_REACT_SERVER_BUILD__")) {
          const replacement = path.relative(
            path.join(outDir, "server", chunk.fileName, ".."),
            path.join(outDir, "rsc", "index.js"),
          );
          code = code.replace("__VIRTUAL_REACT_SERVER_BUILD__", replacement);
          return { code };
        }
        return;
      },
    },

    createVirtualPlugin("client-routes", () => {
      return `
        const glob = import.meta.glob("/${routeDir}/global-error.(js|jsx|ts|tsx)", { eager: true });
        export const GlobalErrorPage = Object.values(glob)[0]?.default;
      `;
    }),

    createVirtualPlugin(ENTRY_BROWSER_WRAPPER.slice("virtual:".length), () => {
      // dev
      if (!manager.buildType) {
        // wrapper entry to ensure client entry runs after vite/react inititialization
        return /* js */ `
          import "${SERVER_CSS_PROXY}";
          import RefreshRuntime from "/@react-refresh";
          RefreshRuntime.injectIntoGlobalHook(window);
          window.$RefreshReg$ = () => {};
          window.$RefreshSig$ = () => (type) => type;
          window.__vite_plugin_react_preamble_installed__ = true;
          await import("${entryBrowser}");
        `;
      }
      // build
      if (manager.buildType === "browser") {
        // import "runtime/client" for preload
        return /* js */ `
          import "${SERVER_CSS_PROXY}";
          import("@hiogawa/react-server/runtime/client");
          import "${entryBrowser}";
        `;
      }
      tinyassert(false);
    }),
  ];
}

// https://github.com/vercel/next.js/blob/90f564d376153fe0b5808eab7b83665ee5e08aaf/packages/next/src/build/webpack-config.ts#L1249-L1280
// https://github.com/pcattori/vite-env-only/blob/68a0cc8546b9a37c181c0b0a025eb9b62dbedd09/src/deny-imports.ts
// https://github.com/sveltejs/kit/blob/84298477a014ec471839adf7a4448d91bc7949e4/packages/kit/src/exports/vite/index.js#L513
function validateImportPlugin(entries: Record<string, string | true>): Plugin {
  return {
    name: validateImportPlugin.name,
    enforce: "pre",
    resolveId(source, importer, options) {
      const entry = entries[source];
      if (entry) {
        // skip validation during optimizeDeps scan since for now
        // we want to allow going through server/client boundary loosely
        if (
          entry === true ||
          manager.buildType === "scan" ||
          ("scan" in options && options.scan)
        ) {
          return "\0virtual:validate-import";
        }
        throw new Error(entry + ` (importer: ${importer ?? "unknown"})`);
      }
      return;
    },
    load(id, _options) {
      if (id === "\0virtual:validate-import") {
        return "export {}";
      }
      return;
    },
  };
}

function serverDepsConfigPlugin(): Plugin {
  return {
    name: serverDepsConfigPlugin.name,
    async configEnvironment(name, _config, env) {
      if (name !== "rsc" && name !== "ssr") {
        return;
      }

      // crawl packages with "react" or "next" in "peerDependencies"
      // see https://github.com/svitejs/vitefu/blob/d8d82fa121e3b2215ba437107093c77bde51b63b/src/index.js#L95-L101
      const result = await crawlFrameworkPkgs({
        root: process.cwd(),
        isBuild: env.command === "build",
        isFrameworkPkgByJson(pkgJson) {
          const deps = pkgJson["peerDependencies"];
          return deps && ("react" in deps || "next" in deps);
        },
      });

      return {
        resolve: {
          noExternal: uniq([
            "react",
            "react-dom",
            "server-only",
            "client-only",
            ...result.ssr.noExternal,
          ]).sort(),
        },
        // pre-bundle cjs deps
        optimizeDeps: {
          include: [
            "react",
            "react-dom",
            "react/jsx-runtime",
            "react/jsx-dev-runtime",
            ...(name === "ssr"
              ? [
                  "react-dom/server.edge",
                  "@hiogawa/react-server > @hiogawa/vite-rsc/react/ssr",
                ]
              : ["@hiogawa/react-server > @hiogawa/vite-rsc/react/rsc"]),
          ],
          exclude: ["@hiogawa/react-server"],
        },
      };
    },
  };
}
