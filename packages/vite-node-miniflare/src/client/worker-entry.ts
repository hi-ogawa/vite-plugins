import {
  type ViteNodeMiniflareClient,
  createViteNodeClient,
} from "./vite-node";

interface Env {
  __UNSAFE_EVAL: any;
  __VITE_NODE_SERVER_RPC_URL: string;
  __VITE_NODE_RUNNER_OPTIONS: any;
  __WORKER_ENTRY: string;
}

let client: ViteNodeMiniflareClient;

export default {
  async fetch(request: Request, env: Env) {
    client ??= createViteNodeClient({
      unsafeEval: env.__UNSAFE_EVAL,
      serverRpcUrl: env.__VITE_NODE_SERVER_RPC_URL,
      runnerOptions: env.__VITE_NODE_RUNNER_OPTIONS,
    });

    try {
      // TODO: refine invalidation
      client.runner.moduleCache.clear();

      const workerEntry = await client.runner.executeFile(env.__WORKER_ENTRY);
      return workerEntry.default.fetch(request, {
        ...env,
        __VITE_NODE_CLIENT: client,
      });
    } catch (e) {
      console.error(e);
      return new Response("error", { status: 500 });
    }
  },
};
