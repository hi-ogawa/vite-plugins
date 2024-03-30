import { fileURLToPath } from "node:url";
import * as httipAdapterNode from "@hattip/adapter-node/native-fetch";
import * as httipCompose from "@hattip/compose";
import {
  type TinyRpcProxy,
  exposeTinyRpc,
  httpClientAdapter,
  httpServerAdapter,
  proxyTinyRpc,
} from "@hiogawa/tiny-rpc";
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
import { CLIENT_RPC_PATH, SERVER_RPC_PATH } from "../shared";

export interface ServerRpc {
  ssrFetchModule: ViteDevServer["ssrFetchModule"];
  send: ServerHMRConnector["send"];
  transformIndexHtml: ViteDevServer["transformIndexHtml"];
  setupClient: (baseUrl: string) => void;
}

export interface ClientRpc {
  onUpdate: (payload: HMRPayload) => void;
}

export function vitePluginViteNodeMiniflare(pluginOptions: {
  entry: string;
  debug?: boolean;
  hmr?: boolean; // for now disable ssr hmr by default for react plugin
  miniflareOptions?: (options: MiniflareOptions) => void;
  customRpc?: Record<string, Function>;
}): Plugin {
  // Initialize miniflare lazily on first request and
  // dispose on server close (e.g. server restart on user vite config change).
  // Otherwise multiple Miniflare could be spawned for example when framework makes use of
  // multiple ViteDevServer (e.g. Remix).
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
      // ClientRpc proxy
      let clientRpc: TinyRpcProxy<ClientRpc> | undefined;

      // we proxy builtin ServerHMRConnector.send/onUpdate via RPC
      // instead of implementing entire HMRChannel on our own
      const connector = new ServerHMRConnector(server);
      connector.onUpdate((payload) => {
        clientRpc?.onUpdate(payload);
      });

      // ServerRpc implementation
      const serverRpcHandler = exposeTinyRpc({
        adapter: httpServerAdapter({ endpoint: SERVER_RPC_PATH }),
        routes: {
          setupClient: (baseUrl) => {
            clientRpc = proxyTinyRpc({
              adapter: httpClientAdapter({ url: baseUrl + CLIENT_RPC_PATH }),
            });
          },
          transformIndexHtml: server.transformIndexHtml,
          ssrFetchModule: (id, importer) => {
            // not using default `viteDevServer.ssrFetchModule` since its source map expects mysterious two empty lines,
            // which doesn't exist in workerd's unsafe eval
            // https://github.com/vitejs/vite/pull/12165#issuecomment-1910686678
            return fetchModule(server, id, importer);
          },
          send: (messages: string) => {
            connector.send(messages);
          },
          // allow framework to extend RPC to implement some features on main Vite process and expose them to Workerd
          // (e.g. Remix's DevServerHooks)
          ...pluginOptions.customRpc,
        } satisfies ServerRpc,
      });

      // lazy setup miniflare + proxy
      const miniflareHandler: httipCompose.RequestHandler = async (ctx) => {
        if (!miniflare) {
          // initialize miniflare on first request
          const miniflareOptions: MiniflareOptions = {
            // explicitly pass `modules` to avoid Miniflare's ModuleLocator analysis error
            modules: [
              {
                type: "ESModule",
                path: fileURLToPath(
                  new URL("./worker-entry.js", import.meta.url),
                ),
              },
            ],
            modulesRoot: "/",
            // reasonable default? (for react-dom/server renderToReadableStream)
            compatibilityDate: "2023-08-01",
            unsafeEvalBinding: "__UNSAFE_EVAL",
            bindings: {
              __WORKER_ENTRY: pluginOptions.entry,
              __VITE_NODE_DEBUG: pluginOptions.debug ?? false,
              __VITE_RUNTIME_ROOT: server.config.root,
              __VITE_RUNTIME_HMR: pluginOptions.hmr ?? false,
            },
          };
          pluginOptions.miniflareOptions?.(miniflareOptions);
          miniflareOptions.bindings!['__WORKER_NODE_COMPAT'] =
            miniflareOptions.compatibilityFlags?.includes("nodejs_compat") ??
            false;
          miniflare = new Miniflare(miniflareOptions);
          await miniflare.ready;
        }

        // fix typings between "lib.dom" and "miniflare"
        const request = ctx.request as any as MiniflareRequest;
        return miniflare.dispatchFetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          duplex: "half",
          redirect: "manual",
        }) as any as Response;
      };

      const middleware = httipAdapterNode.createMiddleware(
        httipCompose.compose(serverRpcHandler, miniflareHandler),
        {
          alwaysCallNext: false,
        },
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
