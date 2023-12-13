import * as httipAdapterNode from "@hattip/adapter-node/native-fetch";
import * as httipCompose from "@hattip/compose";
import { Miniflare, type MiniflareOptions } from "miniflare";
import type { Plugin } from "vite";
import { ViteNodeServer } from "vite-node/server";
import { name as packageName } from "../../package.json";
import { setupViteNodeServerRpc } from "./vite-node";

export function vitePluginViteNodeMiniflare(pluginOptions: {
  entry: string;
  // hook to allow customizing miniflare options
  miniflareOptions?: (options: MiniflareOptions) => void;
}): Plugin {
  // initialize miniflare lazily on first request and
  // dispose on server close (e.g. server restart on user vite config change)
  let miniflare: Miniflare | undefined;

  return {
    name: packageName,
    apply: "serve",
    async configureServer(server) {
      // setup vite-node with rpc
      const viteNodeServer = new ViteNodeServer(server);
      const viteNodeServerRpc = setupViteNodeServerRpc(viteNodeServer);

      // setup middleware
      const middleware = httipAdapterNode.createMiddleware(
        httipCompose.compose(viteNodeServerRpc.requestHandler, async (ctx) => {
          // TODO: extra bindings from user
          // TODO: or proxy to `wrangler.unstable_dev`
          if (!miniflare) {
            const options = viteNodeServerRpc.generateMiniflareOptions({
              entry: pluginOptions.entry,
              rpcOrigin: ctx.url.origin,
            });
            pluginOptions.miniflareOptions?.(options);
            miniflare = new Miniflare(options);
            await miniflare.ready;
          }

          // TODO: method, headers, body, etc..
          // Response typing mismatch
          return miniflare.dispatchFetch(ctx.request.url) as any as Response;
        })
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
