import { fileURLToPath } from "node:url";
import { createDebug, tinyassert } from "@hiogawa/utils";
import {
  type ConfigEnv,
  type InlineConfig,
  type Plugin,
  type PluginOption,
  type ResolvedConfig,
  type ViteDevServer,
  build,
  createLogger,
  createServer,
  isCSSRequest,
} from "vite";
import {
  SERVER_CSS_PROXY,
  vitePluginServerAssets,
} from "../features/assets/plugin";
import type { RouteManifest } from "../features/router/manifest";
import {
  routeManifestPluginClient,
  routeManifestPluginServer,
} from "../features/router/plugin";
import {
  vitePluginClientUseServer,
  vitePluginServerUseServer,
} from "../features/server-action/plugin";
import {
  vitePluginClientUseClient,
  vitePluginServerUseClient,
} from "../features/use-client/plugin";
import { $__global } from "../lib/global";
import {
  ENTRY_CLIENT,
  ENTRY_CLIENT_WRAPPER,
  ENTRY_REACT_SERVER,
  ENTRY_REACT_SERVER_WRAPPER,
  createVirtualPlugin,
  vitePluginSilenceDirectiveBuildWarning,
} from "./utils";

const debug = createDebug("react-server:plugin");

// resolve import paths for `createClientReference`, `createServerReference`, etc...
// since `import "@hiogawa/react-server"` is not always visible for exernal library.
const RUNTIME_BROWSER_PATH = fileURLToPath(
  new URL("../runtime-browser.js", import.meta.url),
);
const RUNTIME_SERVER_PATH = fileURLToPath(
  new URL("../runtime-server.js", import.meta.url),
);
const RUNTIME_REACT_SERVER_PATH = fileURLToPath(
  new URL("../runtime-react-server.js", import.meta.url),
);

// convenient singleton to share states
export type { PluginStateManager };

class PluginStateManager {
  server?: ViteDevServer;
  config!: ResolvedConfig;
  configEnv!: ConfigEnv;

  buildType?: "scan" | "rsc" | "client" | "ssr";

  routeToClientReferences: Record<string, string[]> = {};
  routeManifest?: RouteManifest;

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
    debug("[RscManager.shouldReloadRsc]", { ok, id });
    return ok;
  }
}

// persist singleton during build
if (!process.argv.includes("build")) {
  delete (globalThis as any).__VITE_REACT_SERVER_MANAGER;
}
const manager: PluginStateManager = ((
  globalThis as any
).__VITE_REACT_SERVER_MANAGER ??= new PluginStateManager());

export function vitePluginReactServer(options?: {
  plugins?: PluginOption[];
}): Plugin[] {
  const reactServerViteConfig: InlineConfig = {
    customLogger: createLogger(undefined, {
      prefix: "[react-server]",
      allowClearScreen: false,
    }),
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
      vitePluginSilenceDirectiveBuildWarning(),

      // expose server reference to react-server itself
      vitePluginServerUseServer({
        manager,
        runtimePath: RUNTIME_REACT_SERVER_PATH,
      }),

      // transform "use client" into client referecnes
      vitePluginServerUseClient({
        manager,
        runtimePath: RUNTIME_REACT_SERVER_PATH,
      }),

      routeManifestPluginServer({ manager }),

      // this virtual is not necessary anymore but has been used in the past
      // to extend user's react-server entry like ENTRY_CLIENT_WRAPPER
      createVirtualPlugin(
        ENTRY_REACT_SERVER_WRAPPER.slice("virtual:".length),
        () => `export * from "${ENTRY_REACT_SERVER}";\n`,
      ),

      {
        name: "patch-react-server-dom-webpack",
        transform(code, id, _options) {
          if (id.includes("react-server-dom-webpack")) {
            // rename webpack markers in react server runtime
            // to avoid conflict with ssr runtime which shares same globals
            code = code.replaceAll(
              "__webpack_require__",
              "__vite_react_server_webpack_require__",
            );
            code = code.replaceAll(
              "__webpack_chunk_load__",
              "__vite_react_server_webpack_chunk_load__",
            );

            // make server reference async for simplicity (stale chunkCache, etc...)
            // see TODO in https://github.com/facebook/react/blob/33a32441e991e126e5e874f831bd3afc237a3ecf/packages/react-server-dom-webpack/src/ReactFlightClientConfigBundlerWebpack.js#L131-L132
            code = code.replaceAll("if (isAsyncImport(metadata))", "if (true)");
            code = code.replaceAll("4 === metadata.length", "true");

            return code;
          }
          return;
        },
      },

      ...(options?.plugins ?? []),
    ],
    build: {
      ssr: true,
      manifest: true,
      ssrEmitAssets: true,
      outDir: "dist/rsc",
      rollupOptions: {
        input: {
          index: ENTRY_REACT_SERVER_WRAPPER,
        },
      },
    },
  };

  const rscParentPlugin: Plugin = {
    name: vitePluginReactServer.name,
    config(_config, env) {
      manager.configEnv = env;
      return {
        optimizeDeps: {
          // this can potentially include unnecessary server only deps for client,
          // but there should be no issues except making deps optimization slightly slower.
          entries: ["./src/routes/**/(page|layout|error).(js|jsx|ts|tsx)"],
          exclude: ["@hiogawa/react-server"],
          include: [
            "react",
            "react/jsx-runtime",
            "react/jsx-dev-runtime",
            "react-dom/client",
            "react-server-dom-webpack/client.browser",
            "@hiogawa/react-server > @tanstack/history",
            "@hiogawa/react-server > use-sync-external-store/shim/with-selector.js",
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
                input: ENTRY_CLIENT_WRAPPER,
              },
        },
      };
    },
    configResolved(config) {
      manager.config = config;
    },
    async configureServer(server) {
      manager.server = server;
    },
    async buildStart(_options) {
      if (manager.configEnv.command === "serve") {
        tinyassert(manager.server);
        const reactServer = await createServer(reactServerViteConfig);
        reactServer.pluginContainer.buildStart({});
        $__global.dev = {
          server: manager.server,
          reactServer: reactServer,
        };
      }
    },
    async buildEnd(_options) {
      if (manager.configEnv.command === "serve") {
        await $__global.dev.reactServer.close();
        delete ($__global as any).dev;
      }
    },
    transform(_code, id, _options) {
      if (!id.includes("/node_modules/")) {
        manager.parentIds.add(id);
      }
    },
    async handleHotUpdate(ctx) {
      tinyassert(manager.server);

      // re-render RSC with custom event
      if (ctx.modules.every((m) => m.id && manager.shouldReloadRsc(m.id))) {
        manager.server.hot.send({
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
          for (const m of ctx.modules) {
            for (const imod of m.importers) {
              await manager.server.reloadModule(imod);
            }
          }
          return [];
        }
      }

      // css module is not self-accepting, so we filter out
      // `?direct` module (used for SSR CSS) to avoid browser full reload.
      // (see packages/react-server/src/features/assets/css.ts)
      if (isCSSRequest(ctx.file)) {
        return ctx.modules.filter((m) => !m.id?.includes("?direct"));
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
        console.log("▶▶▶ REACT SERVER BUILD (scan) [1/4]");
        manager.buildType = "scan";
        await build(reactServerViteConfig);
        console.log("▶▶▶ REACT SERVER BUILD (server) [2/4]");
        manager.buildType = "rsc";
        manager.rscUseClientIds.clear();
        await build(reactServerViteConfig);
        console.log("▶▶▶ REACT SERVER BUILD (browser) [3/4]");
        manager.buildType = "client";
      }
    },
    async closeBundle() {
      // TODO: build ssr only when client build succeeds
      if (manager.buildType === "client") {
        console.log("▶▶▶ REACT SERVER BUILD (ssr) [4/4]");
        manager.buildType = "ssr";
        await build({
          build: {
            ssr: true,
          },
        });
      }
    },
  };

  // plugins for main vite dev server (browser / ssr)
  return [
    rscParentPlugin,
    buildOrchestrationPlugin,
    vitePluginSilenceDirectiveBuildWarning(),
    vitePluginClientUseServer({
      manager,
      runtimePath: RUNTIME_BROWSER_PATH,
      ssrRuntimePath: RUNTIME_SERVER_PATH,
    }),
    ...vitePluginClientUseClient({ manager }),
    ...vitePluginServerAssets({ manager }),
    ...routeManifestPluginClient({ manager }),
    createVirtualPlugin(ENTRY_CLIENT_WRAPPER.slice("virtual:".length), () => {
      // dev
      if (!manager.buildType) {
        // wrapper entry to ensure client entry runs after vite/react inititialization
        return /* js */ `
          import "${SERVER_CSS_PROXY}";
          for (let i = 0; !window.__vite_plugin_react_preamble_installed__; i++) {
            await new Promise(resolve => setTimeout(resolve, 10 * (2 ** i)));
          }
          await import("${ENTRY_CLIENT}");
        `;
      }
      // build
      if (manager.buildType === "client") {
        // import "runtime-client" for preload
        return /* js */ `
          import "${SERVER_CSS_PROXY}";
          import("@hiogawa/react-server/runtime-client");
          import "${ENTRY_CLIENT}";
        `;
      }
      tinyassert(false);
    }),
  ];
}
