import * as httipAdapterNode from "@hattip/adapter-node/native-fetch";
import * as httipCompose from "@hattip/compose";
import { exposeTinyRpc, httpServerAdapter } from "@hiogawa/tiny-rpc";
import {
  Miniflare,
  type MiniflareOptions,
  type Request as MiniflareRequest,
} from "miniflare";
import {
  type HMRPayload,
  type Plugin,
  ServerHMRConnector,
  type ViteDevServer,
  fetchModule,
} from "vite";
import { name as packageName } from "../../package.json";
import { fileURLToPath } from "node:url"

export function vitePluginViteNodeMiniflare(pluginOptions: {
  entry: string;
  debug?: boolean;
  hmr?: boolean; // for now disable ssr hmr by default for react plugin
  miniflareOptions?: (options: MiniflareOptions) => void;
  customRpc?: Record<string, Function>;
}): Plugin {
  // initialize miniflare lazily on first request and
  // dispose on server close (e.g. server restart on user vite config change)
  let miniflare: Miniflare | undefined;

  return {
    name: packageName,
    apply: "serve",
    config(_config, _env) {
      return {
        appType: "custom",
        ssr: {
          // force "webworker" since Vite injects "require" banner if `target: "node"`
          // https://github.com/vitejs/vite/blob/a3008671de5b44ced2952f796219c0c4576125ac/packages/vite/src/node/optimizer/index.ts#L824-L830
          target: "webworker",
          noExternal: true,
        },
      };
    },
    async configureServer(server) {
      // setup rpc for vite runtime
      const viteNodeServerRpc = setupViteNodeServerRpc(server, {
        customRpc: pluginOptions.customRpc,
      });

      // setup miniflare + proxy
      // TODO: proxy `wrangler.unstable_dev` to make use of wrangler.toml?
      const miniflareHandler: httipCompose.RequestHandler = async (ctx) => {
        if (!miniflare) {
          // initialize miniflare on first request
          const miniflareOptions = viteNodeServerRpc.generateMiniflareOptions({
            entry: pluginOptions.entry,
            rpcOrigin: ctx.url.origin,
            debug: pluginOptions.debug,
            hmr: pluginOptions.hmr,
          });
          pluginOptions.miniflareOptions?.(miniflareOptions);
          miniflare = new Miniflare(miniflareOptions);
          await miniflare.ready;
        }

        // workaround typing mismatch between "lib.dom" and "miniflare"
        const request = ctx.request as any as MiniflareRequest;
        return miniflare.dispatchFetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          duplex: "half",
        }) as any as Response;
      };

      const middleware = httipAdapterNode.createMiddleware(
        httipCompose.compose(
          viteNodeServerRpc.requestHandler,
          miniflareHandler
        ),
        {
          alwaysCallNext: false,
        }
      );
      return () => server.middlewares.use(middleware);
    },

    async buildEnd() {
      if (miniflare) {
        await miniflare.dispose();
        miniflare = undefined;
      }
    },
  };
}

export type ViteNodeRpc = Pick<
  ViteDevServer,
  "transformIndexHtml" | "ssrFetchModule"
> & {
  // RPC endpoint to proxy ServerHMRConnector
  getHMRPayloads: () => HMRPayload[];
  send: (messages: string) => void;
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
    send: (messages: string) => {
      connector.send(messages);
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
          path: fileURLToPath(new URL("./worker-entry.js", import.meta.url)),
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
