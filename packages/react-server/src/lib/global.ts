import type { ViteDevServer } from "vite";
import type { CallServerCallback, WebpackRequire } from "./types";

// centeralize quick global hacks...

export const __global: {
  dev: {
    server: ViteDevServer;
    reactServer: ViteDevServer;
  };
  callServer: CallServerCallback;
  importServerReference: WebpackRequire;
  getServerReference: WebpackRequire;
  serverReferenceMap: Map<string, unknown>;
} = ((globalThis as any).__REACT_SERVER_GLOBAL ??= {});
