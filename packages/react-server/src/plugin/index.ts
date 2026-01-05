import path from "node:path";
import { tinyassert } from "@hiogawa/utils";
import {
  type ConfigEnv,
  type Plugin,
  type ResolvedConfig,
  type ViteDevServer,
  createServerModuleRunner,
  isCSSRequest,
} from "vite";
import { vitePluginServerAssets } from "../features/assets/plugin";
import { SERVER_CSS_PROXY } from "../features/assets/shared";
import { OUTPUT_SERVER_JS_EXT } from "../features/next/plugin";
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
import { $__global } from "../global";
import {
  ENTRY_BROWSER_WRAPPER,
  ENTRY_SERVER_WRAPPER,
  createVirtualPlugin,
} from "./utils";
export { wrapClientPlugin, wrapServerPlugin } from "./utils";
import rsc from "@vitejs/plugin-rsc";

export type { PrerenderManifest };

// convenient singleton to share states
export type { PluginStateManager };

class PluginStateManager {
  server?: ViteDevServer;
  config!: ResolvedConfig;
  configEnv!: ConfigEnv;

  outDir!: string;

  routeToClientReferences: Record<string, string[]> = {};
  routeManifest?: RouteManifest;
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

  // Framework config plugin - sets up build outputs and environment entries
  const frameworkConfigPlugin: Plugin = {
    name: vitePluginReactServer.name,
    config(_config, env) {
      manager.configEnv = env;
      return {
        optimizeDeps: {
          entries: [
            path.posix.join(
              routeDir,
              `**/(page|layout|error|not-found|loading|template).(js|jsx|ts|tsx)`,
            ),
          ],
          exclude: ["@hiogawa/react-server"],
          include: [
            "@hiogawa/react-server > @vitejs/plugin-rsc/browser",
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
            build: {
              outDir: path.join(outDir, "rsc"),
              sourcemap: true,
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
        // @vitejs/plugin-rsc options
        rsc: {
          serverHandler: false, // framework handles server request routing
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
    async hotUpdate(ctx) {
      // @vitejs/plugin-rsc handles rsc:update events for RSC module changes

      if (this.environment.name === "client") {
        // css module is not self-accepting, so we filter out
        // `?direct` module (used for SSR CSS) to avoid browser full reload.
        if (isCSSRequest(ctx.file)) {
          return ctx.modules.filter((m) => !m.id?.includes("?direct"));
        }

        // Server files can be included in client module graph
        // due to postcss creating dependencies from style.css to all source files.
        const reactServerEnv = $__global.dev.server.environments["rsc"]!;
        if (reactServerEnv.moduleGraph.getModulesByFile(ctx.file)) {
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

  // plugins for main vite dev server (browser / ssr)
  return [
    // @vitejs/plugin-rsc handles:
    // - RSC environment setup
    // - Build orchestration (rsc -> ssr -> rsc -> client -> ssr)
    // - "use client" and "use server" transforms
    // - AsyncLocalStorage injection
    // - server-only/client-only import validation
    // - Server deps config (noExternal, optimizeDeps)
    ...rsc(),
    frameworkConfigPlugin,

    //
    // Framework-specific plugins
    //
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

    //
    // Client-side plugins
    //
    ...vitePluginServerAssets({ manager, entryBrowser, entryServer }),
    ...routeManifestPluginClient({ manager }),
    ...(options?.prerender
      ? prerenderPlugin({ manager, prerender: options.prerender })
      : []),

    createVirtualPlugin("client-routes", () => {
      return `
        const glob = import.meta.glob("/${routeDir}/global-error.(js|jsx|ts|tsx)", { eager: true });
        export const GlobalErrorPage = Object.values(glob)[0]?.default;
      `;
    }),

    createVirtualPlugin(ENTRY_BROWSER_WRAPPER.slice("virtual:".length), function () {
      // dev
      if (this.environment?.mode === "dev") {
        // wrapper entry to ensure client entry runs after vite/react initialization
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
      return /* js */ `
        import "${SERVER_CSS_PROXY}";
        import("@hiogawa/react-server/runtime/client");
        import "${entryBrowser}";
      `;
    }),
  ];
}

