import { ViteNodeRunner } from "vite-node/client";
import { createViteNodeRunner } from "./client";

let viteNodeRunner: ViteNodeRunner;

export default {
  async fetch(request: Request, env: any) {
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
