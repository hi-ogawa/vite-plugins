import { exposeTinyRpc, httpServerAdapter } from "@hiogawa/tiny-rpc";
import type { MiniflareOptions } from "miniflare";
import { type ViteDevServer, normalizePath } from "vite";
import type { ViteNodeRunnerOptions } from "vite-node";
import type { ViteNodeServer } from "vite-node/server";
import { WORKER_ENTRY_SCRIPT } from "../client/worker-entry-script";

// TODO: allow expanding API for framework features? (e.g. Remix's DevServerHooks)
// prettier-ignore
export type ViteNodeRpc =
  Pick<ViteNodeServer, "fetchModule" | "resolveId"> &
  Pick<ViteDevServer, "transformIndexHtml"> &
  {
    getInvalidatedModules: () => string[];
  };

export function setupViteNodeServerRpc(viteNodeServer: ViteNodeServer) {
  const rpcBase = "/__vite_node_rpc__";

  // keep track of invalidated modules similar to nuxt
  // https://github.com/nuxt/nuxt/blob/1de44a5a5ca5757d53a8b52c9809cbc027d2d246/packages/vite/src/vite-node.ts#L62
  const invalidatedModules = new Set<string>();

  const rpcRoutes: ViteNodeRpc = {
    fetchModule: viteNodeServer.fetchModule.bind(viteNodeServer),
    resolveId: viteNodeServer.resolveId.bind(viteNodeServer),
    transformIndexHtml: viteNodeServer.server.transformIndexHtml,
    getInvalidatedModules: () => {
      // there must be at most one client to make use of this RPC
      const result = [...invalidatedModules];
      invalidatedModules.clear();
      return result;
    },
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
      // reasonable default? (ReadableStream etc...)
      compatibilityDate: "2023-08-01",
      // expose to runtime
      unsafeEvalBinding: "__UNSAFE_EVAL",
      bindings: {
        __WORKER_ENTRY: options.entry,
        __VITE_NODE_SERVER_RPC_URL: options.rpcOrigin + rpcBase,
        __VITE_NODE_RUNNER_OPTIONS: options.viteNodeRunnerOptions as any,
        __VITE_NODE_DEBUG: options.debug ?? false,
      },
    } satisfies MiniflareOptions;
  }

  return {
    requestHandler,
    generateMiniflareOptions,
  };
}
