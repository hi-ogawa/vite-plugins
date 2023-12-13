import { ViteNodeRunner } from "vite-node/client";
import { createViteNodeRunner } from "./vite-node";

let viteNodeRunner: ViteNodeRunner;

interface Env {
  __UNSAFE_EVAL: any;
  __VITE_NODE_SERVER_RPC_URL: string;
  __VITE_NODE_RUNNER_OPTIONS: any;
  __WORKER_ENTRY: string;
}

export default {
  async fetch(request: Request, env: Env) {
    viteNodeRunner ??= createViteNodeRunner({
      unsafeEval: env.__UNSAFE_EVAL,
      serverRpcUrl: env.__VITE_NODE_SERVER_RPC_URL,
      runnerOptions: env.__VITE_NODE_RUNNER_OPTIONS,
    });

    try {
      // TODO: refine invalidation
      viteNodeRunner.moduleCache.clear();

      const workerEntry = await viteNodeRunner.executeFile(env.__WORKER_ENTRY);
      return workerEntry.default.fetch(request, env);
    } catch (e) {
      console.error(e);
      return new Response("error", { status: 500 });
    }
  },
};
