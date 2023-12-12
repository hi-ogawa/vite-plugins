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
    // quick and dirty
    Object.assign(globalThis, { env });

    console.log("[workerd] url =", request.url);
    console.log(env.UNSAFE_EVAL);
    console.log(env.VITE_NODE_SERVER_URL);
    console.log(viteNodeRunner);

    try {
      const mod = await viteNodeRunner.executeFile("/src/demo-app.ts");
      console.log(mod);
      return new Response(mod.hi("vite node on workerd"));
    } catch (e) {}

    const resolved = await viteNodeServerProxy.resolveId("/src/demo-app.ts");
    console.log(resolved);
    if (resolved) {
      const fetchedMod = await viteNodeServerProxy.fetchModule(resolved.id);
      console.log(fetchedMod);
      try {
        const mod = await viteNodeRunner.executeId(resolved.id);
        console.log(mod);
        return new Response(mod.hi("vite node on workerd"));
      } catch (e) {
        console.log(e);
      }
    }

    return new Response("hello");
  },
};
