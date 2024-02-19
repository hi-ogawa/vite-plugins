import {
  type TinyRpcProxy,
  exposeTinyRpc,
  httpClientAdapter,
  httpServerAdapter,
  proxyTinyRpc,
} from "@hiogawa/tiny-rpc";
import { once } from "@hiogawa/utils";
import type { HMRPayload } from "vite";
import { type HMRRuntimeConnection, ViteRuntime } from "vite/runtime";
import type { ClientRpc, ServerRpc } from "../server/plugin";
import { CLIENT_RPC_PATH, SERVER_RPC_PATH } from "../shared";

interface Env {
  __UNSAFE_EVAL: any;
  __VITE_NODE_SERVER_RPC_URL: string;
  __VITE_NODE_DEBUG: boolean;
  __VITE_RUNTIME_ROOT: string;
  __VITE_RUNTIME_HMR: boolean;
  __WORKER_ENTRY: string;
}

export interface ViteNodeMiniflareClient {
  rpc: TinyRpcProxy<ServerRpc>;
  runtime: ViteRuntime;
  hmrConnection: SimpleHMRConnection;
}

let client: ViteNodeMiniflareClient;

const initializeOnce = once(async (request: Request, env: Env) => {
  client = await createViteNodeClient({
    baseUrl: new URL(request.url).origin,
    unsafeEval: env.__UNSAFE_EVAL,
    root: env.__VITE_RUNTIME_ROOT,
    debug: env.__VITE_NODE_DEBUG,
    hmr: env.__VITE_RUNTIME_HMR,
  });
});

export default {
  async fetch(request: Request, env: Env, ctx: unknown) {
    try {
      // initialize vite node client only once
      await initializeOnce(request, env);

      // handle client rpc
      const clientRpcResponse = await client.hmrConnection.clientRpcHandler({
        request,
      });
      if (clientRpcResponse) {
        return clientRpcResponse;
      }

      const workerEntry = await client.runtime.executeEntrypoint(
        env.__WORKER_ENTRY
      );
      const workerEnv = {
        ...env,
        __VITE_NODE_MINIFLARE_CLIENT: client, // sneak this in for customRpc usage
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

async function createViteNodeClient(options: {
  baseUrl: string;
  unsafeEval: any;
  root: string;
  debug: boolean;
  hmr: boolean;
}): Promise<ViteNodeMiniflareClient> {
  // ServerRpc proxy
  const rpc = proxyTinyRpc<ServerRpc>({
    adapter: httpClientAdapter({ url: options.baseUrl + SERVER_RPC_PATH }),
  });
  await rpc.setupClient(options.baseUrl);

  // implement HMRConnection by http rpc
  const hmrConnection = new SimpleHMRConnection({
    rpc: rpc,
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
        console.log("[runViteModule]", { id });

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

// HMRConnection by proxying ServerHMRConnector
class SimpleHMRConnection implements HMRRuntimeConnection {
  clientRpcHandler: ReturnType<
    ReturnType<typeof httpServerAdapter>["register"]
  >;
  onUpdateCallback!: (payload: HMRPayload) => void;

  constructor(
    private options: {
      rpc: {
        send: (messages: string) => Promise<void>;
      };
      debug?: boolean;
      hmr?: boolean;
    }
  ) {
    const clientRpc: ClientRpc = {
      onUpdate: async (payload) => {
        // customize onUpdate callback for non-hmr mode and debugging
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
          return;
        }
        // Workerd needs to wait until promise is resolved
        await this.onUpdateCallback(payload);
      },
    };
    this.clientRpcHandler = exposeTinyRpc({
      adapter: httpServerAdapter({
        endpoint: CLIENT_RPC_PATH,
      }),
      routes: clientRpc,
    });
  }

  //
  // implements HMRRuntimeConnection
  //

  isReady(): boolean {
    return true;
  }

  send(messages: string): void {
    this.options.rpc.send(messages);
  }

  onUpdate(callback: (payload: HMRPayload) => void): void {
    this.onUpdateCallback = callback;
  }
}
