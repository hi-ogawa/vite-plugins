import { fileURLToPath } from "node:url";
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
import { SERVER_RPC_PATH } from "../shared";

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
      // for now, we collect HMRPayload with builtin ServerHMRConnector
      // and let worker entry fetch them via rpc before rendering
      const connector = new ServerHMRConnector(server);
      let hmrPayloads: HMRPayload[] = [];
      connector.onUpdate((payload) => {
        hmrPayloads.push(payload);
      });

      const serverRpcHandler = exposeTinyRpc({
        routes: {
          transformIndexHtml: server.transformIndexHtml,
          ssrFetchModule: (id, importer) => {
            // not using default `viteDevServer.ssrFetchModule` since its source map expects mysterious two empty lines,
            // which doesn't exist in workerd's unsafe eval
            // https://github.com/vitejs/vite/pull/12165#issuecomment-1910686678
            return fetchModule(server, id, importer);
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
          ...pluginOptions.customRpc,
        } satisfies ServerRpc,
        adapter: httpServerAdapter({ endpoint: SERVER_RPC_PATH }),
      });

      // lazy setup miniflare + proxy
      // TODO: proxy `wrangler.unstable_dev` to make use of wrangler.toml?
      const miniflareHandler: httipCompose.RequestHandler = async (ctx) => {
        if (!miniflare) {
          // initialize miniflare on first request
          const miniflareOptions: MiniflareOptions = {
            // explicitly pass `modules` to avoid Miniflare's ModuleLocator analysis error
            modules: [
              {
                type: "ESModule",
                path: fileURLToPath(
                  new URL("./worker-entry.js", import.meta.url)
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
          redirect: "manual",
        }) as any as Response;
      };

      const middleware = httipAdapterNode.createMiddleware(
        httipCompose.compose(serverRpcHandler, miniflareHandler),
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

export interface ServerRpc {
  ssrFetchModule: ViteDevServer["ssrFetchModule"];
  send: ServerHMRConnector["send"];
  getHMRPayloads: () => HMRPayload[];
  transformIndexHtml: ViteDevServer["transformIndexHtml"];
}
