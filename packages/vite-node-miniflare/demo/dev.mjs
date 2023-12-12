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
  console.log(":: vite node rpc ready");

  //
  // miniflare
  //
  const { WORKER_ENTRY_SCRIPT } = await import("../dist/index.js");

  const miniflare = new Miniflare({
    // pass modules explicitly to avoid Miniflare's ModuleLocator analysis error
    modulesRoot: "/",
    modules: [
      {
        type: "ESModule",
        path: "/dummy.js",
        contents: WORKER_ENTRY_SCRIPT,
      },
    ],
    unsafeEvalBinding: "__UNSAFE_EVAL",
    // pass config via bindings (aka runtime variables)
    bindings: {
      __WORKER_ENTRY: "/src/demo/entry.ts",
      __VITE_NODE_RPC_URL: "http://localhost:8888/vite-node-rpc",
      __VITE_NODE_RUNNER_OPTIONS: {
        root: viteDevServer.config.root,
      },
    },
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
