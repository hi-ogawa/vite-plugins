import { exposeTinyRpc, httpServerAdapter } from "@hiogawa/tiny-rpc";
import type { MiniflareOptions } from "miniflare";
import type { ViteNodeServer } from "vite-node/server";
import { WORKER_SCRIPT } from "./worker-script";

export function setupViteNodeServerRpc(viteNodeServer: ViteNodeServer) {
  const rpcBase = "/__vite_node_rpc__";

  const requestHandler = exposeTinyRpc({
    routes: viteNodeServer,
    adapter: httpServerAdapter({ endpoint: rpcBase }),
  });

  function createMiddleware() {
    // TODO
  }

  function generateMiniflareOptions(options: {
    entry: string;
    rpcHost: string;
  }) {
    return {
      // explicitly pass `modules` to avoid Miniflare's ModuleLocator analysis error
      modules: [
        {
          type: "ESModule",
          path: "/dummy.js",
          contents: WORKER_SCRIPT,
        },
      ],
      modulesRoot: "/",
      // expose to runtime
      unsafeEvalBinding: "__UNSAFE_EVAL",
      bindings: {
        __WORKER_ENTRY: options.entry,
        __VITE_NODE_SERVER_RPC_URL: options.rpcHost + rpcBase,
        __VITE_NODE_RUNNER_OPTIONS: {
          root: viteNodeServer.server.config.root,
        },
      },
    } satisfies MiniflareOptions;
  }

  return {
    requestHandler,
    createMiddleware,
    generateMiniflareOptions,
  };
}
