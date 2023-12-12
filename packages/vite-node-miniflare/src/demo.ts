import { httpClientAdapter, proxyTinyRpc } from "@hiogawa/tiny-rpc";
import { ViteNodeRunner } from "vite-node/client";
import type { ViteNodeServer } from "vite-node/server";
import { __setUnsafeEval } from "./polyfills/node-vm";

export default {
  async fetch(request: Request, env: Env) {
    __setUnsafeEval(env.__UNSAFE_EVAL);
    viteNodeRunner ??= createViteNodeRunner(env);
    try {
      // TODO: how to invalidate?
      const workerEntry = await viteNodeRunner.executeFile(env.__WORKER_ENTRY);
      return workerEntry.default.fetch(request, env);
    } catch (e) {
      console.error(e);
      return new Response("error", { status: 500 });
    }
  },
};

interface Env {
  __UNSAFE_EVAL: any;
  __WORKER_ENTRY: string;
  __VITE_NODE_RPC_URL: string;
  __VITE_NODE_RUNNER_OPTIONS: {
    root: string;
  };
}

let viteNodeRunner: ViteNodeRunner;

function createViteNodeRunner(env: Env) {
  const viteNodeServerProxy = proxyTinyRpc<ViteNodeServer>({
    adapter: httpClientAdapter({ url: env.__VITE_NODE_RPC_URL }),
  });

  return new ViteNodeRunner({
    ...env.__VITE_NODE_RUNNER_OPTIONS,
    fetchModule(id) {
      return viteNodeServerProxy.fetchModule(id);
    },
    resolveId(id, importer) {
      return viteNodeServerProxy.resolveId(id, importer);
    },
  });
}
