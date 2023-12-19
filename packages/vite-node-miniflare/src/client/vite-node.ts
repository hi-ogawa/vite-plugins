import {
  type TinyRpcProxy,
  httpClientAdapter,
  proxyTinyRpc,
} from "@hiogawa/tiny-rpc";
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

  installSourcemapsSupport({
    getSourceMap: (source) => runner.moduleCache.getSourceMap(source),
  });

  return { rpc, runner };
}
