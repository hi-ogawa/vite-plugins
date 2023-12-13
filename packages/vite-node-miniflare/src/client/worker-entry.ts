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
    // initialize vite node client only once
    client ??= createViteNodeClient({
      unsafeEval: env.__UNSAFE_EVAL,
      serverRpcUrl: env.__VITE_NODE_SERVER_RPC_URL,
      runnerOptions: env.__VITE_NODE_RUNNER_OPTIONS,
    });

    try {
      // invalidate modules
      // cf. https://github.com/nuxt/nuxt/blob/1de44a5a5ca5757d53a8b52c9809cbc027d2d246/packages/vite/src/runtime/vite-node.mjs#L21-L23
      const invalidatedModules = await client.rpc.getInvalidatedModules();
      const invalidatedTree =
        client.runner.moduleCache.invalidateDepTree(invalidatedModules);
      // TODO: log only debug mode
      console.log("[invalidateDepTree]", { invalidatedModules, invalidatedTree });

      const workerEntry = await client.runner.executeId(env.__WORKER_ENTRY);
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
