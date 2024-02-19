import {
  type TinyRpcProxy,
  // TwoWaySseClient,
  WebSocketMessagePort,
  // httpClientAdapter,
  exposeTinyRpc,
  messagePortClientAdapter,
  messagePortServerAdapter,
  proxyTinyRpc,
} from "@hiogawa/tiny-rpc";
// import type { HMRPayload } from "vite";
import { createManualPromise, once } from "@hiogawa/utils";
import type { HMRPayload } from "vite";
// import { FetchEventSource } from "./event-source";
import {
  // type HMRRuntimeConnection,
  ViteRuntime,
} from "vite/runtime";
import type {
  ClientRpc,
  ServerRpc,
  // ViteNodeRpc
} from "../server/plugin";

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
  // hmrConnection: SimpleHMRConnection;
}

let client: ViteNodeMiniflareClient;

const setupClient = once(async (env: Env) => {
  client = await createViteNodeClient({
    unsafeEval: env.__UNSAFE_EVAL,
    serverRpcUrl: env.__VITE_NODE_SERVER_RPC_URL,
    root: env.__VITE_RUNTIME_ROOT,
    debug: env.__VITE_NODE_DEBUG,
    hmr: env.__VITE_RUNTIME_HMR,
  });
});

export default {
  async fetch(request: Request, env: Env, ctx: unknown) {
    // console.log("[worker]", request.url);
    try {
      await setupClient(env);
      // // initialize vite node client only once
      // client ??= await createViteNodeClient({
      //   unsafeEval: env.__UNSAFE_EVAL,
      //   serverRpcUrl: env.__VITE_NODE_SERVER_RPC_URL,
      //   root: env.__VITE_RUNTIME_ROOT,
      //   debug: env.__VITE_NODE_DEBUG,
      //   hmr: env.__VITE_RUNTIME_HMR,
      // });

      // fetch HMRPayload before execution
      // await client.hmrConnection.applyHMR();

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
  unsafeEval: any;
  serverRpcUrl: string;
  root: string;
  debug: boolean;
  hmr: boolean;
}): Promise<ViteNodeMiniflareClient> {
  // polyfill EventSource
  // Object.assign(globalThis, { EventSource: FetchEventSource });

  // https://developers.cloudflare.com/workers/examples/websockets/#write-a-websocket-client
  const websocket = new WebSocket(options.serverRpcUrl.replace(/^http/, "ws"));
  const promise = createManualPromise<void>();
  websocket.addEventListener("open", (e) => {
    console.log("[websocket.open]", e);
    promise.resolve();
  });
  await promise;

  const port = new WebSocketMessagePort(websocket);

  // HMRConnection based on tiny-rpc + SSE
  // const client = await TwoWaySseClient.create({
  //   endpoint: options.serverRpcUrl,
  // });

  // setup ServerRpc proxy
  const rpc = proxyTinyRpc<ServerRpc>({
    adapter: messagePortClientAdapter({
      port,
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    }),
  });

  // implement ClientRpc
  exposeTinyRpc({
    adapter: messagePortServerAdapter({
      port,
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    }),
    routes: {
      onUpdate(payload) {
        onUpdateCallback(payload);
      },
    } satisfies ClientRpc,
  });

  // const rpc = proxyTinyRpc<ViteNodeRpc>({
  //   adapter: httpClientAdapter({ url: options.serverRpcUrl }),
  // });

  // implement HMRConnectoin based on uni-directional RPC
  // const hmrConnection = new SimpleHMRConnection({
  //   rpc: {
  //     getHMRPayloads: rpc.getHMRPayloads,
  //     send: rpc.send,
  //   },
  //   debug: options.debug,
  //   hmr: options.hmr,
  // });

  let onUpdateCallback!: (payload: HMRPayload) => void;

  const runtime = new ViteRuntime(
    {
      root: options.root,
      fetchModule: (id: string, importer?: string) => {
        console.log("[rpc.ssrFetchModule]", { id, importer });
        return rpc.ssrFetchModule(id, importer);
      },
      sourcemapInterceptor: "prepareStackTrace",
      hmr: {
        connection: {
          isReady() {
            return true;
          },
          onUpdate(callback) {
            onUpdateCallback = callback;
            // // expose clientRpc.onUpdate
            // exposeTinyRpc({
            //   adapter: messagePortServerAdapter({
            //     port,
            //     serialize: JSON.stringify,
            //     deserialize: JSON.parse,
            //   }),
            //   routes: {
            //     onUpdate(payload) {
            //       callback(payload);
            //     },
            //   } satisfies ClientRpc,
            // });
          },
          send(messages) {
            rpc.send(messages);
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
        console.error("[vite-node-miniflare] runExternalModule:", filepath);
        throw new Error(`[vite-node-miniflare] runExternalModule: ${filepath}`);
      },
    }
  );

  // return { rpc, runtime, hmrConnection };
  return { rpc, runtime };
}

// Making simple HMRConnection based on uni-directional RPC
// class SimpleHMRConnection implements HMRRuntimeConnection {
//   onUpdateCallback!: (payload: HMRPayload) => void;

//   constructor(
//     private options: {
//       rpc: {
//         getHMRPayloads: () => Promise<HMRPayload[]>;
//         send: (messages: string) => Promise<void>;
//       };
//       debug?: boolean;
//       hmr?: boolean;
//     }
//   ) {}

//   // TODO: queue multiple calls of `applyHMR` to keep last one awaited until all handled
//   async applyHMR() {
//     const payloads = await this.options.rpc.getHMRPayloads();
//     for (const payload of payloads) {
//       if (this.options.debug) {
//         console.log("[vite-node-miniflare] HMRPayload:", payload);
//       }
//       // use simple module tree invalidation for non-hmr mode
//       if (!this.options.hmr && payload.type === "update") {
//         for (const update of payload.updates) {
//           const invalidated = client.runtime.moduleCache.invalidateDepTree([
//             update.path,
//           ]);
//           if (this.options.debug) {
//             console.log("[vite-node-miniflare] invalidateDepTree:", [
//               ...invalidated,
//             ]);
//           }
//         }
//         continue;
//       }
//       await (this.onUpdateCallback(payload) as any as Promise<void>);
//     }
//   }

//   //
//   // implements HMRRuntimeConnection
//   //

//   isReady(): boolean {
//     return true;
//   }

//   onUpdate(callback: (payload: HMRPayload) => void): void {
//     this.onUpdateCallback = callback;
//   }

//   send(messages: string): void {
//     this.options.rpc.send(messages);
//   }
// }
