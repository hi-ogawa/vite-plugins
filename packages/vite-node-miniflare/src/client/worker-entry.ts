import {
  type ViteNodeMiniflareClient,
  createViteNodeClient,
} from "./vite-node";

interface Env {
  __UNSAFE_EVAL: any;
  __VITE_NODE_SERVER_RPC_URL: string;
  __VITE_NODE_RUNNER_OPTIONS: any;
  __VITE_NODE_DEBUG: boolean;
  __WORKER_ENTRY: string;
}

let client: ViteNodeMiniflareClient;

export default {
  async fetch(request: Request, env: Env, ctx: unknown) {
    try {
      // initialize vite node client only once
      client ??= createViteNodeClient({
        unsafeEval: env.__UNSAFE_EVAL,
        serverRpcUrl: env.__VITE_NODE_SERVER_RPC_URL,
        runnerOptions: env.__VITE_NODE_RUNNER_OPTIONS,
        debug: env.__VITE_NODE_DEBUG,
      });

      // invalidate modules similar to nuxt
      // https://github.com/nuxt/nuxt/blob/1de44a5a5ca5757d53a8b52c9809cbc027d2d246/packages/vite/src/runtime/vite-node.mjs#L21-L23
      const invalidatedModules = await client.rpc.getInvalidatedModules();
      const invalidatedTree =
        client.runner.moduleCache.invalidateDepTree(invalidatedModules);
      if (env.__VITE_NODE_DEBUG) {
        console.log("[vite-node-miniflare] invalidateDepTree:", {
          invalidatedModules,
          invalidatedTree,
        });
      }

      const workerEntry = await client.runner.executeId(env.__WORKER_ENTRY);
      const workerEnv = {
        ...env,
        __VITE_NODE_MINIFLARE_CLIENT: client,
      };
      return await workerEntry.default.fetch(request, workerEnv, ctx);
    } catch (e) {
      console.error(e);
      let body = "[vite-node-miniflare error]\n";
      if (e instanceof Error) {
        body += `${e.stack ?? e.message}`;
      }
      return new Response(body, { status: 500 });
    }
  },
};
