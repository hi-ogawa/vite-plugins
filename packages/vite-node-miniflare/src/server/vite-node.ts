import { exposeTinyRpc, httpServerAdapter } from "@hiogawa/tiny-rpc";
import type { MiniflareOptions } from "miniflare";
import type { ViteDevServer } from "vite";
import type { ViteNodeServer } from "vite-node/server";
import { WORKER_ENTRY_SCRIPT } from "../client/worker-entry-script";

// TODO: add endpoint to check module invalidation?
// TODO: allow expanding API for framework features? (e.g. Remix's DevServerHooks)
export type ViteNodeRpc = Pick<ViteNodeServer, "fetchModule" | "resolveId"> &
  Pick<ViteDevServer, "transformIndexHtml">;

export function setupViteNodeServerRpc(viteNodeServer: ViteNodeServer) {
  const rpcBase = "/__vite_node_rpc__";

  const rpcRoutes: ViteNodeRpc = {
    fetchModule: viteNodeServer.fetchModule.bind(viteNodeServer),
    resolveId: viteNodeServer.resolveId.bind(viteNodeServer),
    transformIndexHtml: viteNodeServer.server.transformIndexHtml,
  };

  const requestHandler = exposeTinyRpc({
    routes: rpcRoutes,
    adapter: httpServerAdapter({ endpoint: rpcBase }),
  });

  function generateMiniflareOptions(options: {
    entry: string;
    rpcOrigin: string;
  }) {
    return {
      // explicitly pass `modules` to avoid Miniflare's ModuleLocator analysis error
      modules: [
        {
          type: "ESModule",
          path: "/dummy.js",
          contents: WORKER_ENTRY_SCRIPT,
        },
      ],
      modulesRoot: "/",
      // expose to runtime
      unsafeEvalBinding: "__UNSAFE_EVAL",
      bindings: {
        __WORKER_ENTRY: options.entry,
        __VITE_NODE_SERVER_RPC_URL: options.rpcOrigin + rpcBase,
        __VITE_NODE_RUNNER_OPTIONS: {
          root: viteNodeServer.server.config.root,
        },
      },
    } satisfies MiniflareOptions;
  }

  return {
    requestHandler,
    generateMiniflareOptions,
  };
}
