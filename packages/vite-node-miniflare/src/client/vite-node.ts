import {
  type TinyRpcProxy,
  httpClientAdapter,
  proxyTinyRpc,
} from "@hiogawa/tiny-rpc";
import { tinyassert } from "@hiogawa/utils";
import type { ViteNodeRunnerOptions } from "vite-node";
import { ViteNodeRunner } from "vite-node/client";
import { installSourcemapsSupport } from "vite-node/source-map";
import { ESModulesRunner, ViteRuntime } from "vite/runtime";
import type { ViteNodeRpc } from "..";
import { __setDebug } from "./polyfills/debug";
import { __setUnsafeEval } from "./polyfills/node-vm";

export interface ViteNodeMiniflareClient {
  rpc: TinyRpcProxy<ViteNodeRpc>;
  runner: ViteNodeRunner;
  runtime: ViteRuntime;
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

  const runtime = new ViteRuntime(
    {
      root: options.runnerOptions.root,
      fetchModule(id, importer) {
        // console.log({ id, importer });
        return rpc.ssrFetchModule(id, importer);
      },
      hmr: {
        connection: {
          isReady() {
            return true;
          },
          // TODO: only for custom event to server
          send(messages) {
            console.log("[runtime.hmr.connection.send]", messages);
          },
          // TODO: for now, we fetch HMRPayload via rpc
          onUpdate(callback) {
            console.log("[runtime.hmr.connection.onUpdate]", callback);
          },
        },
        logger: console,
      },
    },
    {
      ...new ESModulesRunner(), // TODO: processImport?

      async runViteModule(context, transformed) {
        // TODO: inline sourcemap not working with unsafeEval?

        if (1) {
          // use newAsyncFunction instead of eval (but this doesn't seems to help)
          // https://github.com/cloudflare/workerd/blob/5e2544fd2948b53e68831a9b219dc1e9970cf96f/src/workerd/api/unsafe.c%2B%2B#L48
          // https://github.com/sapphi-red/vite-envs/blob/9e47653f4cdd557d263fd315d22ccf76d78aa638/packages/cloudflare-pages/src/client/index.ts#L83
          const initModule = options.unsafeEval.newAsyncFunction(
            '"use strict";' + transformed,
            "__filename",
            ...Object.keys(context)
          );
          await initModule(...Object.values(context));
          Object.freeze(context.__vite_ssr_exports__);
          return;
        }

        // do same as vite-node/client
        // https://github.com/vitest-dev/vitest/blob/c6e04125fb4a0af2db8bd58ea193b965d50d415f/packages/vite-node/src/client.ts#L415
        const codeDefinition = `'use strict';async (${Object.keys(context).join(
          ","
        )})=>{{`;
        const code = `${codeDefinition}${transformed}\n}}`;
        const fn = options.unsafeEval.eval(code);
        await fn(...Object.values(context));
        Object.freeze(context.__vite_ssr_exports__);
      },

      runExternalModule(filepath, metadata) {
        console.error("[runExternalModule]", filepath, metadata);
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

  return { rpc, runner, runtime };
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
