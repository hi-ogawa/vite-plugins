import { httpClientAdapter, proxyTinyRpc } from "@hiogawa/tiny-rpc";
import { ViteNodeRunner } from "vite-node/client";
import type { ViteNodeServer } from "vite-node/server";

const viteNodeServerProxy = proxyTinyRpc<ViteNodeServer>({
  adapter: httpClientAdapter({ url: "http://localhost:8888/vite-node-rpc" }),
});

const viteNodeRunner = new ViteNodeRunner({
  // TODO: does client "root" matters?
  root: "/",
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
    // (quick-and-dirty) expose UNSAFE_EVAL to polyfills/node-vm.ts
    Object.assign(globalThis, { env });

    try {
      const entryModule: typeof import("./demo/entry") =
        await viteNodeRunner.executeFile("/src/demo/entry.ts");
      return entryModule.default.fetch(request, env);
    } catch (e) {
      console.log(e);
      return new Response("error", { status: 500 });
    }
  },
};
