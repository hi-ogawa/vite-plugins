import { httpClientAdapter, proxyTinyRpc } from "@hiogawa/tiny-rpc";
import { ViteNodeRunner } from "vite-node/client";
import type { ViteNodeServer } from "vite-node/server";

const viteNodeServerProxy = proxyTinyRpc<ViteNodeServer>({
  adapter: httpClientAdapter({ url: "http://localhost:8888/vite-node-rpc" }),
});

const viteNodeRunner = new ViteNodeRunner({
  root: "/home/hiroshi/code/personal/vite-plugins/packages/vite-node-miniflare",
  base: "/",
  fetchModule(id) {
    return viteNodeServerProxy.fetchModule(id);
  },
  resolveId(id, importer) {
    return viteNodeServerProxy.resolveId(id, importer);
  },
});

export default {
  async fetch(request: Request, env: any) {
    console.log("[workerd] url =", request.url);
    console.log(env.UNSAFE_EVAL);
    console.log(env.VITE_NODE_SERVER_URL);
    console.log(viteNodeRunner);
    console.log(await viteNodeServerProxy.resolveId("/src/demo-app.ts"));

    return new Response("hello");
  },
};
