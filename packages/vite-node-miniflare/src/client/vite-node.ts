import {
  type TinyRpcProxy,
  httpClientAdapter,
  proxyTinyRpc,
} from "@hiogawa/tiny-rpc";
import { ViteRuntime } from "vite/runtime";
import type { ViteNodeRpc } from "..";

export interface ViteNodeMiniflareClient {
  rpc: TinyRpcProxy<ViteNodeRpc>;
  runtime: ViteRuntime;
}

export function createViteNodeClient(options: {
  unsafeEval: any;
  serverRpcUrl: string;
  root: string;
  debug: boolean;
}): ViteNodeMiniflareClient {
  const rpc = proxyTinyRpc<ViteNodeRpc>({
    adapter: httpClientAdapter({ url: options.serverRpcUrl }),
  });

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
          // TODO: for now, we fetch HMRPayload via rpc, so nothing to register
          onUpdate(callback) {
            console.log("[runtime.hmr.connection.onUpdate]", callback);
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

  return { rpc, runtime };
}
