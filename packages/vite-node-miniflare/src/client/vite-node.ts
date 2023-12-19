import {
  type TinyRpcProxy,
  httpClientAdapter,
  proxyTinyRpc,
} from "@hiogawa/tiny-rpc";
import { tinyassert } from "@hiogawa/utils";
import type { ViteNodeRunnerOptions } from "vite-node";
import { ViteNodeRunner } from "vite-node/client";
import { installSourcemapsSupport } from "vite-node/source-map";
import type { ViteNodeRpc } from "..";
import { __setDebug } from "./polyfills/debug";
import { __setUnsafeEval } from "./polyfills/node-vm";

export interface ViteNodeMiniflareClient {
  rpc: TinyRpcProxy<ViteNodeRpc>;
  runner: ViteNodeRunner;
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
  installSourcemapsSupport({
    getSourceMap: (source) => {
      const teardown = setupBufferPolyfill();
      try {
        return runner.moduleCache.getSourceMap(source);
      } finally {
        teardown();
      }
    },
  });

  return { rpc, runner };
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
