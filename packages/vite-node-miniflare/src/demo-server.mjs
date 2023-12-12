import fs from "node:fs";
import * as httipAdapterNode from "@hattip/adapter-node";
import * as httipCompose from "@hattip/compose";
import { exposeTinyRpc, httpServerAdapter } from "@hiogawa/tiny-rpc";
import { Log, Miniflare } from "miniflare";
import { createServer } from "vite";
import { ViteNodeServer } from "vite-node/server";

async function main() {
  //
  // vite dev server
  //
  const viteDevServer = await createServer({
    root: "/home/hiroshi/code/personal/vite-plugins/packages/vite-node-miniflare",
    configFile: false,
    optimizeDeps: {
      disabled: true,
    },
  });
  await viteDevServer.pluginContainer.buildStart({});
  console.log(":: vite dev server ready");

  //
  // vite node server + rpc
  //
  const viteNodeServer = new ViteNodeServer(viteDevServer);

  const viteNodeRpcHandler = exposeTinyRpc({
    routes: viteNodeServer,
    adapter: httpServerAdapter({ endpoint: "/vite-node-rpc" }),
  });
  const viteNodeRpcServer = httipAdapterNode.createServer(
    httipCompose.compose(viteNodeRpcHandler)
  );

  await new Promise((resolve) => {
    viteNodeRpcServer.listen(8888, () => {
      resolve(null);
    });
  });
  console.log(":: vite node ready");

  //
  // miniflare
  //
  const script = await fs.promises.readFile("./dist/demo.js", "utf-8");

  const miniflare = new Miniflare({
    // pass modules explicitly to avoid Miniflare's ModuleLocator error
    modulesRoot: "/",
    modules: [
      {
        type: "ESModule",
        path: "/dummy.js",
        contents: script,
      },
    ],
    unsafeEvalBinding: "UNSAFE_EVAL",
    // pass config via bindings (aka runtime variables)
    bindings: {
      // __VITE_NODE_SERVER_URL: "http://localhost:8888",
      // __VITE_ROOT: "",
    },
    log: new Log(),
  });
  await miniflare.ready;
  console.log(":: miniflare ready");

  //
  // fetch request
  //
  const res = await miniflare.dispatchFetch("https://dummy.local/");
  const resText = await res.text();
  console.log("@@@ response @@@");
  console.log(resText);

  // TODO: still hanging resource after dispose?
  await miniflare.dispose();
}

main();
