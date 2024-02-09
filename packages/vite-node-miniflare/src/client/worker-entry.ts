import {
  type TinyRpcProxy,
  httpClientAdapter,
  proxyTinyRpc,
} from "@hiogawa/tiny-rpc";
import type { HMRPayload } from "vite";
import { ViteRuntime } from "vite/runtime";
import type { ViteNodeRpc } from "../server/plugin";

interface Env {
  __UNSAFE_EVAL: any;
  __VITE_NODE_SERVER_RPC_URL: string;
  __VITE_NODE_DEBUG: boolean;
  __VITE_RUNTIME_ROOT: string;
  __VITE_RUNTIME_HMR: boolean;
  __WORKER_ENTRY: string;
}

export interface ViteNodeMiniflareClient {
  rpc: TinyRpcProxy<ViteNodeRpc>;
  runtime: ViteRuntime;
  runtimeHMRHandler: (payload: HMRPayload) => void;
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

function createViteNodeClient(options: {
  unsafeEval: any;
  serverRpcUrl: string;
  root: string;
  debug: boolean;
}): ViteNodeMiniflareClient {
  const rpc = proxyTinyRpc<ViteNodeRpc>({
    adapter: httpClientAdapter({ url: options.serverRpcUrl }),
  });

  let runtimeHMRHandler!: (payload: HMRPayload) => void;

  const runtime = new ViteRuntime(
    {
      root: options.root,
      fetchModule(id, importer) {
        return rpc.ssrFetchModule(id, importer);
      },
      sourcemapInterceptor: "prepareStackTrace",
      hmr: {
        connection: {
          isReady() {
            return true;
          },
          // TODO: only for custom event to server?
          send(messages) {
            console.log("[runtime.hmr.connection.send]", messages);
          },
          // TODO: for now, we fetch HMRPayload via separate rpc, so we just grab the callback and use it later.
          onUpdate(callback) {
            // this is called during ViteRuntime constructor
            runtimeHMRHandler = callback;
          },
        },
        logger: console,
      },
    },
    {
      async runViteModule(context, transformed, id) {
        // do same as vite-node/client
        // https://github.com/vitest-dev/vitest/blob/c6e04125fb4a0af2db8bd58ea193b965d50d415f/packages/vite-node/src/client.ts#L415
        const codeDefinition = `'use strict';async (${Object.keys(context).join(
          ","
        )})=>{{`;
        const code = `${codeDefinition}${transformed}\n}}`;
        const fn = options.unsafeEval.eval(code, id);
        await fn(...Object.values(context));
        Object.freeze(context.__vite_ssr_exports__);
      },

      runExternalModule(filepath) {
        console.error("[runExternalModule]", filepath);
        throw new Error(`[runExternalModule] ${filepath}`);
      },
    }
  );

  return { rpc, runtime, runtimeHMRHandler };
}
