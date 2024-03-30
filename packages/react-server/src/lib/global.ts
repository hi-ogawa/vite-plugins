import type { ViteDevServer } from "vite";
import type { CallServerCallback } from "./types";

// centeralize quick global hacks...

export const __global: {
  dev: {
    server: ViteDevServer;
    reactServer: ViteDevServer;
    ssrImportCache: Map<string, Promise<unknown>>;
  };
  callServer: CallServerCallback;
} = ((globalThis as any).__REACT_SERVER_GLOBAL ??= {});
