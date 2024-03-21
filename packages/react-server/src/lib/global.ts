import type { ViteDevServer } from "vite";
import type { CallServerCallback } from "./types";

// centeralize quick global escape hatch...

export const __global: {
  dev: {
    server: ViteDevServer;
    reactServer: ViteDevServer;
  };
  callServer: CallServerCallback;
  // TODO: isolate by renderId
  // TODO: track which error boundary to enable on 2nd pass
  ssrError?: Error;
} = ((globalThis as any).__REACT_SERVER_GLOBAL ??= {});
