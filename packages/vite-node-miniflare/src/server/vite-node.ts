import { exposeTinyRpc, httpServerAdapter } from "@hiogawa/tiny-rpc";
import type { MiniflareOptions } from "miniflare";
import {
  type HMRPayload,
  ServerHMRConnector,
  type ViteDevServer,
  fetchModule,
} from "vite";
import { WORKER_ENTRY_SCRIPT } from "../client/worker-entry-script";

// prettier-ignore
export type ViteNodeRpc =
  Pick<ViteDevServer, "transformIndexHtml" | "ssrFetchModule"> &
  {
    getHMRPayloads: () => HMRPayload[];
  };

export function setupViteNodeServerRpc(
  viteDevServer: ViteDevServer,
  options: { customRpc?: Record<string, Function> }
) {
  const rpcBase = "/__vite_node_rpc__";

  // for now, we collect HMRPayload with builtin ServerHMRConnector
  // and let worker entry fetch them via rpc before rendering
  const connector = new ServerHMRConnector(viteDevServer);
  let hmrPayloads: HMRPayload[] = [];
  connector.onUpdate((payload) => {
    hmrPayloads.push(payload);
  });

  const rpcRoutes: ViteNodeRpc = {
    transformIndexHtml: viteDevServer.transformIndexHtml,
    ssrFetchModule: (id, importer) => {
      // not using default `viteDevServer.ssrFetchModule` since its source map expects mysterious two empty lines,
      // which doesn't exist in workerd's unsafe eval
      // https://github.com/vitejs/vite/pull/12165#issuecomment-1910686678
      return fetchModule(viteDevServer, id, importer);
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

  const requestHandler = exposeTinyRpc({
    routes: rpcRoutes,
    adapter: httpServerAdapter({ endpoint: rpcBase }),
  });

  function generateMiniflareOptions(options: {
    entry: string;
    rpcOrigin: string;
    debug?: boolean;
    hmr?: boolean;
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
        __VITE_NODE_DEBUG: options.debug ?? false,
        __VITE_RUNTIME_ROOT: viteDevServer.config.root,
        __VITE_RUNTIME_HMR: options.hmr ?? false,
      },
    } satisfies MiniflareOptions;
  }

  return {
    requestHandler,
    generateMiniflareOptions,
  };
}
