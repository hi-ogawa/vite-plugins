import * as httipAdapterNode from "@hattip/adapter-node/native-fetch";
import * as httipCompose from "@hattip/compose";
import { Log, Miniflare } from "miniflare";
import type { Plugin } from "vite";
import { ViteNodeServer } from "vite-node/server";
import { name as packageName } from "../package.json";
import { setupViteNodeServerRpc } from "./server";

export function vitePluginViteNodeMiniflare(pluginOptions: {
  entry: string;
}): Plugin {
  return {
    name: packageName,
    apply: "serve",
    async configureServer(server) {
      // setup vite-node with rpc
      const viteNodeServer = new ViteNodeServer(server);
      const viteNodeServerRpc = setupViteNodeServerRpc(viteNodeServer);

      // initialize miniflare lazily on first request
      let miniflare: Miniflare;

      // setup middleware
      const middleware = httipAdapterNode.createMiddleware(
        httipCompose.compose(viteNodeServerRpc.requestHandler, async (ctx) => {
          // TODO: extra bindings from user
          // TODO: or proxy to `wrangler.unstable_dev`
          if (!miniflare) {
            miniflare = new Miniflare({
              ...viteNodeServerRpc.generateMiniflareOptions({
                entry: pluginOptions.entry,
                rpcOrigin: ctx.url.origin,
              }),
              log: new Log(),
            });
            await miniflare.ready;
          }

          // TODO: method, headers, body, etc..
          // Response typing mismatch
          return miniflare.dispatchFetch(ctx.request.url) as any as Response;
        })
      );

      return () => server.middlewares.use(middleware);
    },
  };
}
