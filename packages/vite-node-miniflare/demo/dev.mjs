import * as httipAdapterNode from "@hattip/adapter-node";
import * as httipCompose from "@hattip/compose";
import { Log, Miniflare } from "miniflare";
import { createServer } from "vite";
import { ViteNodeServer } from "vite-node/server";
import { setupViteNodeServerRpc } from "../dist/index.js";

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
  });
  await viteDevServer.pluginContainer.buildStart({});
  console.log(":: vite dev server ready");

  const viteNodeServer = new ViteNodeServer(viteDevServer);

  //
  // vite node server rpc
  //
  const viteNodeRpcResult = setupViteNodeServerRpc(viteNodeServer);

  const viteNodeRpcServer = httipAdapterNode.createServer(
    httipCompose.compose(viteNodeRpcResult.requestHandler)
  );
  await new Promise((resolve) => {
    viteNodeRpcServer.listen(8888, () => {
      resolve(null);
    });
  });
  console.log(":: vite node rpc ready");

  const miniflare = new Miniflare({
    ...viteNodeRpcResult.generateMiniflareOptions({
      entry: "/demo/server.ts",
      rpcHost: "http://localhost:8888",
    }),
    log: new Log(),
    port: 7777,
  });
  await miniflare.ready;
  console.log(":: miniflare ready");

  //
  // demo request
  //
  const res = await fetch("http://127.0.0.1:7777");
  const resText = await res.text();
  console.log(":: demo response");
  console.log(resText);

  // TODO: still hanging resource after dispose?
  // await miniflare.dispose();
}

main();
