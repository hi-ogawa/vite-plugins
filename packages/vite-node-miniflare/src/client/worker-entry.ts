import {
  type ViteNodeMiniflareClient,
  createViteNodeClient,
} from "./vite-node";

interface Env {
  __UNSAFE_EVAL: any;
  __VITE_NODE_SERVER_RPC_URL: string;
  __VITE_NODE_DEBUG: boolean;
  __VITE_RUNTIME_ROOT: string;
  __VITE_RUNTIME_HMR: boolean;
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
        root: env.__VITE_RUNTIME_ROOT,
        debug: env.__VITE_NODE_DEBUG,
      });

      // fetch HMRPayload before execution
      // TODO: listen HMRPayload event (birpc? websocket? SSE?)
      const payloads = await client.rpc.getHMRPayloads();
      for (const payload of payloads) {
        if (env.__VITE_NODE_DEBUG) {
          console.log("[HMRPayload]", payload);
        }
        // simple module tree invalidation when ssr hmr is disabled
        if (!env.__VITE_RUNTIME_HMR && payload.type === "update") {
          for (const update of payload.updates) {
            // TODO: unwrapId?
            const invalidated = client.runtime.moduleCache.invalidateDepTree([
              update.path,
            ]);
            if (env.__VITE_NODE_DEBUG) {
              console.log("[vite-node-miniflare] invalidateDepTree:", [
                ...invalidated,
              ]);
            }
          }
          continue;
        }
        await (client.runtimeHMRHandler(payload) as any as Promise<void>);
      }

      const workerEntry = await client.runtime.executeEntrypoint(
        env.__WORKER_ENTRY
      );
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
