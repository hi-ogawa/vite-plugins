import * as h3 from "h3";
import {
  Miniflare,
  type MiniflareOptions,
  type Request as MiniflareRequest,
} from "miniflare";
import type { Plugin } from "vite";
import type { ViteNodeRunnerOptions, ViteNodeServerOptions } from "vite-node";
import { ViteNodeServer } from "vite-node/server";
import { name as packageName } from "../../package.json";
import { setupViteNodeServerRpc } from "./vite-node";

export function vitePluginViteNodeMiniflare(pluginOptions: {
  entry: string;
  debug?: boolean;
  // hooks to customize options
  miniflareOptions?: (options: MiniflareOptions) => void;
  viteNodeServerOptions?: (options: ViteNodeServerOptions) => void;
  viteNodeRunnerOptions?: (options: Partial<ViteNodeRunnerOptions>) => void;
}): Plugin {
  // initialize miniflare lazily on first request and
  // dispose on server close (e.g. server restart on user vite config change)
  let miniflare: Miniflare | undefined;

  return {
    name: packageName,
    apply: "serve",
    async configureServer(server) {
      // setup vite-node with rpc
      const viteNodeServerOptions: ViteNodeServerOptions = {
        debug: {
          dumpModules: pluginOptions.debug,
        },
      };
      pluginOptions.viteNodeServerOptions?.(viteNodeServerOptions);
      const viteNodeServer = new ViteNodeServer(server, viteNodeServerOptions);
      const viteNodeServerRpc = setupViteNodeServerRpc(viteNodeServer);

            // setup miniflare + proxy
      // TODO: proxy `wrangler.unstable_dev` to make use of wrangler.toml?
      const miniflareHandler = h3.eventHandler(async (event) => {
        const url = h3.getRequestURL(event);

        if (!miniflare) {
          const viteNodeRunnerOptions: Partial<ViteNodeRunnerOptions> = {
            root: server.config.root,
            base: server.config.base,
            debug: !!pluginOptions.debug,
          };
          pluginOptions.viteNodeRunnerOptions?.(viteNodeRunnerOptions);

          const miniflareOptions = viteNodeServerRpc.generateMiniflareOptions({
            entry: pluginOptions.entry,
            rpcOrigin: url.origin,
            debug: pluginOptions.debug,
            viteNodeRunnerOptions,
          });
          pluginOptions.miniflareOptions?.(miniflareOptions);
          miniflare = new Miniflare(miniflareOptions);
          await miniflare.ready;
        }

        // workaround typing mismatch between "lib.dom" and "miniflare"
        const request = h3.toWebRequest(event) as any as MiniflareRequest;
        return miniflare.dispatchFetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          duplex: "half",
        }) as any as Response;
      });

      const app = h3.createApp().use([
        h3.eventHandler((event) =>
          viteNodeServerRpc.requestHandler({
            request: h3.toWebRequest(event),
          })
        ),
        miniflareHandler,
      ]);

      return () => server.middlewares.use(h3.toNodeListener(app));
    },

    async buildEnd() {
      if (miniflare) {
        await miniflare.dispose();
        miniflare = undefined;
      }
    },
  };
}
