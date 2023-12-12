import { httpClientAdapter, proxyTinyRpc } from "@hiogawa/tiny-rpc";
import { ViteNodeRunner } from "vite-node/client";
import type { ViteNodeServer } from "vite-node/server";
import { env, setEnv } from "./env";

export default {
  async fetch(request: Request, env: any) {
    setEnv(env);
    viteNodeRunner ??= createViteNodeRunner();

    try {
      const workerEntry = await viteNodeRunner.executeFile(env.__WORKER_ENTRY);
      return workerEntry.default.fetch(request, env);
    } catch (e) {
      console.error(e);
      return new Response("error", { status: 500 });
    }
  },
};

let viteNodeRunner: ViteNodeRunner;

function createViteNodeRunner() {
  const viteNodeServerProxy = proxyTinyRpc<ViteNodeServer>({
    adapter: httpClientAdapter({ url: env.__VITE_NODE_RPC_URL }),
  });

  return new ViteNodeRunner({
    root: env.__VITE_NODE_ROOT,
    base: "/",
    fetchModule(id) {
      return viteNodeServerProxy.fetchModule(id);
    },
    resolveId(id, importer) {
      return viteNodeServerProxy.resolveId(id, importer);
    },
  });
}
