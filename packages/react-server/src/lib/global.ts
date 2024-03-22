import type { RouterHistory } from "@tanstack/history";
import type { ViteDevServer } from "vite";
import type { CallServerCallback } from "./types";

// centeralize quick global escape hatch...

export const __global: {
  dev: {
    server: ViteDevServer;
    reactServer: ViteDevServer;
  };
  history: RouterHistory;
  callServer: CallServerCallback;
  // see "virtual:self-reference-workaround"
  clientInternal: typeof import("../client-internal");
  serverInternal: typeof import("../server-internal");
} = ((globalThis as any).__REACT_SERVER_GLOBAL ??= {});
