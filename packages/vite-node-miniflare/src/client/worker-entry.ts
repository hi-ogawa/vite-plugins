import {
  exposeTinyRpc,
  httpClientAdapter,
  httpServerAdapter,
  proxyTinyRpc,
} from "@hiogawa/tiny-rpc";
import { once } from "@hiogawa/utils";
import type { HMRPayload } from "vite";
import { ViteRuntime } from "vite/runtime";
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

export default {
  async fetch(request: Request, env: Env, ctx: unknown) {
    try {
      const fetchHandler = await createFetchHandlerOnce({
        workerEntry: env.__WORKER_ENTRY,
        baseUrl: new URL(request.url).origin,
        unsafeEval: env.__UNSAFE_EVAL,
        root: env.__VITE_RUNTIME_ROOT,
        debug: env.__VITE_NODE_DEBUG,
        hmr: env.__VITE_RUNTIME_HMR,
      });
      return await fetchHandler(request, env, ctx);
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

type FetchHandler = (
  request: Request,
  env: Env,
  ctx: unknown
) => Promise<Response>;

const createFetchHandlerOnce = once(createFetchHandler);

async function createFetchHandler(options: {
  workerEntry: string;
  baseUrl: string;
  unsafeEval: any;
  root: string;
  debug: boolean;
  hmr: boolean;
}) {
  // ServerRpc proxy
  const serverRpc = proxyTinyRpc<ServerRpc>({
    adapter: httpClientAdapter({ url: options.baseUrl + SERVER_RPC_PATH }),
  });
  await serverRpc.setupClient(options.baseUrl);

  // ClientRpc implementation
  const clientRpcHandler = exposeTinyRpc({
    adapter: httpServerAdapter({ endpoint: CLIENT_RPC_PATH }),
    routes: {
      async onUpdate(payload) {
        await customOnUpdateFn(onUpdateCallback, runtime, options)(payload);
      },
    } satisfies ClientRpc,
  });

  let onUpdateCallback!: OnUpdateFn;

  const runtime = new ViteRuntime(
    {
      root: options.root,
      fetchModule(id, importer) {
        return serverRpc.ssrFetchModule(id, importer);
      },
      sourcemapInterceptor: "prepareStackTrace",
      hmr: {
        connection: {
          isReady: () => true,
          onUpdate(callback) {
            onUpdateCallback = callback as any;
          },
          send(messages) {
            serverRpc.send(messages);
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

  const fetchHandler: FetchHandler = async (request, env, ctx) => {
    const response = await clientRpcHandler({ request });
    if (response) {
      return response;
    }

    const workerEntry = await runtime.executeEntrypoint(options.workerEntry);
    const workerEnv = {
      ...env,
      __RPC: serverRpc, // extend for customRpc usage
    };
    return workerEntry.default.fetch(request, workerEnv, ctx);
  };
  return fetchHandler;
}

type OnUpdateFn = (payload: HMRPayload) => Promise<void>;

function customOnUpdateFn(
  originalFn: OnUpdateFn,
  runtime: ViteRuntime,
  options: { debug: boolean; hmr: boolean }
): OnUpdateFn {
  return async (payload) => {
    if (options.debug) {
      console.log("[vite-node-miniflare] HMRPayload:", payload);
    }
    // use simple module tree invalidation for non-hmr mode
    if (!options.hmr && payload.type === "update") {
      for (const update of payload.updates) {
        const invalidated = runtime.moduleCache.invalidateDepTree([
          update.path,
        ]);
        if (options.debug) {
          console.log("[vite-node-miniflare] invalidateDepTree:", [
            ...invalidated,
          ]);
        }
      }
      return;
    }
    // Workerd needs to wait until promise is resolved during the request handling
    await originalFn(payload);
  };
}
