import { exposeTinyRpc, httpServerAdapter } from "@hiogawa/tiny-rpc";
import type { MiniflareOptions } from "miniflare";
import {
  type HMRPayload,
  ServerHMRConnector,
  type ViteDevServer,
  fetchModule,
  normalizePath,
} from "vite";
import type { ViteNodeRunnerOptions } from "vite-node";
import type { ViteNodeServer } from "vite-node/server";
import { WORKER_ENTRY_SCRIPT } from "../client/worker-entry-script";

// TODO(refactor): no point to have this file separated. move to plugin.ts

// prettier-ignore
export type ViteNodeRpc =
  Pick<ViteNodeServer, "fetchModule" | "resolveId"> &
  Pick<ViteDevServer, "transformIndexHtml" | "ssrFetchModule"> &
  {
    getInvalidatedModules: () => string[];
    getHMRPayloads: () => HMRPayload[];
  };

export function setupViteNodeServerRpc(
  viteNodeServer: ViteNodeServer,
  options: { customRpc?: Record<string, Function> }
) {
  const rpcBase = "/__vite_node_rpc__";

  // keep track of invalidated modules similar to nuxt
  // https://github.com/nuxt/nuxt/blob/1de44a5a5ca5757d53a8b52c9809cbc027d2d246/packages/vite/src/vite-node.ts#L62
  const invalidatedModules = new Set<string>();

  // for starter, collect HMRPayload with builtin ServerHMRConnector
  // and let worker entry to fetch them via rpc
  const connector = new ServerHMRConnector(viteNodeServer.server);
  let hmrPayloads: HMRPayload[] = [];
  connector.onUpdate((payload) => {
    hmrPayloads.push(payload);
  });

  const rpcRoutes: ViteNodeRpc = {
    fetchModule: viteNodeServer.fetchModule.bind(viteNodeServer),
    resolveId: viteNodeServer.resolveId.bind(viteNodeServer),
    transformIndexHtml: viteNodeServer.server.transformIndexHtml,
    ssrFetchModule: (id, importer) => {
      // not using default `viteDevServer.ssrFetchModule` since its source map expects mysterious two empty lines,
      // which doesn't exist in workerd's unsafe eval
      // https://github.com/vitejs/vite/pull/12165#issuecomment-1910686678
      return fetchModule(viteDevServer, id, importer);
    },
    getInvalidatedModules: () => {
      // there must be at most one client to make use of this RPC
      const result = [...invalidatedModules];
      invalidatedModules.clear();
      return result;
    },
    getHMRPayloads: () => {
      const result = hmrPayloads;
      hmrPayloads = [];
      return result;
    },
    // framework can utilize custom RPC to implement some features on main Vite process and expose them to Workerd
    // (e.g. Remix's DevServerHooks)
    ...options.customRpc,
  };

  // TODO: support framework-specific virtual modules invalidation?
  const viteDevServer = viteNodeServer.server;
  viteDevServer.watcher.on("all", (_event, filepath) => {
    const modules = viteDevServer.moduleGraph.getModulesByFile(
      normalizePath(filepath)
    );
    if (modules) {
      for (const mod of modules) {
        if (mod.id) {
          invalidatedModules.add(mod.id);
        }
      }
    }
  });

  const requestHandler = exposeTinyRpc({
    routes: rpcRoutes,
    adapter: httpServerAdapter({ endpoint: rpcBase }),
  });

  function generateMiniflareOptions(options: {
    entry: string;
    rpcOrigin: string;
    debug?: boolean;
    hmr?: boolean;
    viteNodeRunnerOptions: Partial<ViteNodeRunnerOptions>;
  }) {
    return {
      // explicitly pass `modules` to avoid Miniflare's ModuleLocator analysis error
      modules: [
        {
          type: "ESModule",
          path: "/__vite_node_miniflare_entry.js",
          contents: WORKER_ENTRY_SCRIPT,
        },
      ],
      modulesRoot: "/",
      // reasonable default? (for react-dom/server renderToReadableStream)
      compatibilityDate: "2023-08-01",
      // expose to runtime
      unsafeEvalBinding: "__UNSAFE_EVAL",
      bindings: {
        __WORKER_ENTRY: options.entry,
        __VITE_NODE_SERVER_RPC_URL: options.rpcOrigin + rpcBase,
        __VITE_NODE_RUNNER_OPTIONS: options.viteNodeRunnerOptions as any,
        __VITE_NODE_DEBUG: options.debug ?? false,
        __VITE_RUNTIME_HMR: options.hmr ?? false,
      },
    } satisfies MiniflareOptions;
  }

  return {
    requestHandler,
    generateMiniflareOptions,
  };
}
