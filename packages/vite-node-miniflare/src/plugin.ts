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
    config(_config, _env) {
      return {
        appType: "custom",
        // TODO: how to know port lazily?
        server: {
          port: 8888,
        },
      };
    },
    async configureServer(server) {
      // setup vite-node with rpc
      const viteNodeServer = new ViteNodeServer(server);
      const viteNodeServerRpc = setupViteNodeServerRpc(viteNodeServer);

      // setup miniflare
      const miniflare = new Miniflare({
        ...viteNodeServerRpc.generateMiniflareOptions({
          entry: pluginOptions.entry,
          rpcOrigin: "http://localhost:8888",
        }),
        log: new Log(),
      });
      await miniflare.ready;

      // setup as hattip middleware
      const middleware = httipAdapterNode.createMiddleware(
        httipCompose.compose(viteNodeServerRpc.requestHandler, (ctx) => {
          // TODO: method, headers, body, etc..
          return miniflare.dispatchFetch(ctx.request.url) as any as Response;
        })
      );

      function use() {
        server.middlewares.use((req, res, next) => {
          middleware(req, res, next);
        });
      }

      return () => use();
    },
  };
}
