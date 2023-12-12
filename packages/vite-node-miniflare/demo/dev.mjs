import * as httipAdapterNode from "@hattip/adapter-node/native-fetch";
import * as httipCompose from "@hattip/compose";
import { Log, Miniflare } from "miniflare";
import { createServer } from "vite";
import { ViteNodeServer } from "vite-node/server";
import { setupViteNodeServerRpc } from "../dist/index.js";
import { colors } from "@hiogawa/utils";

async function main() {
  //
  // vite dev server + vite node server
  //
  const viteDevServer = await createServer({
    configFile: false,
    optimizeDeps: {
      disabled: true,
    },
    ssr: {
      noExternal: true,
    },
    server: {
      hmr: false,
    },
    clearScreen: false,
    appType: "custom",
    plugins: [
      {
        name: "local:vite-node-miniflare-middleware",
        configureServer(server) {
          function use() {
            server.middlewares.use((req, res, next) => {
              viteNodeMiniflareMiddleware(req, res, next);
            });
          }
          return () => use();
        },
      },
    ],
  });
  const viteNodeServer = new ViteNodeServer(viteDevServer);

  //
  // vite node miniflare
  //
  const viteNodeRpcResult = setupViteNodeServerRpc(viteNodeServer);
  const port = 8888;
  const urlOrigin = `http://localhost:${port}`;

  // TODO: how to force Miniflare not to allocate port?
  const miniflare = new Miniflare({
    ...viteNodeRpcResult.generateMiniflareOptions({
      entry: "/demo/server.ts",
      rpcOrigin: urlOrigin,
    }),
    log: new Log(),
  });
  await miniflare.ready;
  console.log(":: miniflare ready");

  const viteNodeMiniflareMiddleware = httipAdapterNode.createMiddleware(
    httipCompose.compose(
      viteNodeRpcResult.requestHandler,
      // @ts-ignore
      (ctx) => {
        // TODO: method, headers, body, etc..
        return miniflare.dispatchFetch(ctx.request.url);
      }
    )
  );
  await viteDevServer.listen(port);
  console.log(`:: vite server ready at ${colors.cyan(urlOrigin)}`);

  //
  // demo request
  //
  const res = await fetch(urlOrigin);
  const resText = await res.text();
  console.log(":: demo request");
  console.log(resText);

  // TODO: still hanging resource after dispose?
  // await miniflare.dispose();
}

main();
