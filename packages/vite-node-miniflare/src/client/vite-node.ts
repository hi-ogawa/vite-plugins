import {
  type TinyRpcProxy,
  httpClientAdapter,
  proxyTinyRpc,
} from "@hiogawa/tiny-rpc";
import { tinyassert } from "@hiogawa/utils";
import type { HMRPayload } from "vite";
import type { ViteNodeRunnerOptions } from "vite-node";
import { ViteNodeRunner } from "vite-node/client";
import { installSourcemapsSupport } from "vite-node/source-map";
import { ViteRuntime } from "vite/runtime";
import type { ViteNodeRpc } from "..";
import { __setDebug } from "./polyfills/debug";
import { __setUnsafeEval } from "./polyfills/node-vm";

export interface ViteNodeMiniflareClient {
  rpc: TinyRpcProxy<ViteNodeRpc>;
  runner: ViteNodeRunner;
  runtime: ViteRuntime;
  runtimeHMRHandler: (payload: HMRPayload) => void;
}

export function createViteNodeClient(options: {
  unsafeEval: any;
  serverRpcUrl: string;
  runnerOptions: Omit<ViteNodeRunnerOptions, "fetchModule" | "resolveId">;
  debug: boolean;
}): ViteNodeMiniflareClient {
  __setUnsafeEval(options.unsafeEval);
  __setDebug(options.debug);

  const rpc = proxyTinyRpc<ViteNodeRpc>({
    adapter: httpClientAdapter({ url: options.serverRpcUrl }),
  });

  let runtimeHMRHandler!: (payload: HMRPayload) => void;

  const runtime = new ViteRuntime(
    {
      root: options.runnerOptions.root,
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

  const runner = new ViteNodeRunner({
    ...options.runnerOptions,
    fetchModule(id) {
      return rpc.fetchModule(id);
    },
    resolveId(id, importer) {
      return rpc.resolveId(id, importer);
    },
  });

  // Since Vitest's getSourceMap/extractSourceMap relies on `Buffer.from(mapString, 'base64').toString('utf-8')`,
  // we inject minimal Buffer polyfill temporary during this function.
  // https://github.com/vitest-dev/vitest/blob/8dabef860a3f51f5a4c4debc10faa1837fdcdd71/packages/vite-node/src/source-map.ts#L57-L62
  // prettier-ignore
  0 && installSourcemapsSupport({
    getSourceMap: (source) => {
      const teardown = setupBufferPolyfill();
      try {
        return runner.moduleCache.getSourceMap(source);
      } finally {
        teardown();
      }
    },
  });

  return { rpc, runner, runtime, runtimeHMRHandler };
}

function setupBufferPolyfill() {
  const prev = globalThis.Buffer;
  globalThis.Buffer = BufferPolyfill as any;
  return () => {
    globalThis.Buffer = prev;
  };
}

const BufferPolyfill = {
  from: (s: unknown, encoding: unknown) => {
    tinyassert(typeof s === "string");
    tinyassert(encoding === "base64");
    return {
      toString: (encoding: unknown) => {
        tinyassert(encoding === "utf-8");
        return atob(s);
      },
    };
  },
};
