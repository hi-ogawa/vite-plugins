import {
  type TinyRpcProxy,
  httpClientAdapter,
  proxyTinyRpc,
} from "@hiogawa/tiny-rpc";
import type { HMRPayload } from "vite";
import { type HMRRuntimeConnection, ViteRuntime } from "vite/runtime";
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
  hmrConnection: SimpleHMRConnection;
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
        hmr: env.__VITE_RUNTIME_HMR,
      });

      // fetch HMRPayload before execution
      await client.hmrConnection.applyHMR();

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
  hmr: boolean;
}): ViteNodeMiniflareClient {
  const rpc = proxyTinyRpc<ViteNodeRpc>({
    adapter: httpClientAdapter({ url: options.serverRpcUrl }),
  });

  // implement HMRConnectoin based on uni-directional RPC
  const hmrConnection = new SimpleHMRConnection({
    rpc: {
      getHMRPayloads: rpc.getHMRPayloads,
      send: rpc.send,
    },
    debug: options.debug,
    hmr: options.hmr,
  });

  const runtime = new ViteRuntime(
    {
      root: options.root,
      fetchModule(id, importer) {
        return rpc.ssrFetchModule(id, importer);
      },
      sourcemapInterceptor: "prepareStackTrace",
      hmr: {
        connection: hmrConnection,
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
        console.error("[vite-node-miniflare] runExternalModule:", filepath);
        throw new Error(`[vite-node-miniflare] runExternalModule: ${filepath}`);
      },
    }
  );

  return { rpc, runtime, hmrConnection };
}

// Making simple HMRConnection based on uni-directional RPC
class SimpleHMRConnection implements HMRRuntimeConnection {
  onUpdateCallback!: (payload: HMRPayload) => void;

  constructor(
    private options: {
      rpc: {
        getHMRPayloads: () => Promise<HMRPayload[]>;
        send: (messages: string) => Promise<void>;
      };
      debug?: boolean;
      hmr?: boolean;
    }
  ) {}

  // TODO: queue multiple calls of `applyHMR` to keep last one awaited until all handled
  async applyHMR() {
    const payloads = await this.options.rpc.getHMRPayloads();
    for (const payload of payloads) {
      if (this.options.debug) {
        console.log("[vite-node-miniflare] HMRPayload:", payload);
      }
      // use simple module tree invalidation for non-hmr mode
      if (!this.options.hmr && payload.type === "update") {
        for (const update of payload.updates) {
          const invalidated = client.runtime.moduleCache.invalidateDepTree([
            update.path,
          ]);
          if (this.options.debug) {
            console.log("[vite-node-miniflare] invalidateDepTree:", [
              ...invalidated,
            ]);
          }
        }
        continue;
      }
      await (this.onUpdateCallback(payload) as any as Promise<void>);
    }
  }

  //
  // implements HMRRuntimeConnection
  //

  isReady(): boolean {
    return true;
  }

  onUpdate(callback: (payload: HMRPayload) => void): void {
    this.onUpdateCallback = callback;
  }

  send(messages: string): void {
    this.options.rpc.send(messages);
  }
}
