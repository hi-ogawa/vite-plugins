import { httpClientAdapter, proxyTinyRpc } from "@hiogawa/tiny-rpc";
import type { ViteNodeRunnerOptions } from "vite-node";
import { ViteNodeRunner } from "vite-node/client";
import type { ViteNodeServer } from "vite-node/server";
import { __setUnsafeEval } from "./polyfills/node-vm";

export function createViteNodeRunner(options: {
  unsafeEval: any;
  serverRpcUrl: string;
  runnerOptions: Omit<ViteNodeRunnerOptions, "fetchModule" | "resolveId">;
}): ViteNodeRunner {
  __setUnsafeEval(options.unsafeEval);

  const viteNodeServerProxy = proxyTinyRpc<ViteNodeServer>({
    adapter: httpClientAdapter({ url: options.serverRpcUrl }),
  });

  return new ViteNodeRunner({
    ...options.runnerOptions,
    fetchModule(id) {
      return viteNodeServerProxy.fetchModule(id);
    },
    resolveId(id, importer) {
      return viteNodeServerProxy.resolveId(id, importer);
    },
  });
}
