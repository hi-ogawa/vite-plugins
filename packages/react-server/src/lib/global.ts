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
} = ((globalThis as any).__REACT_SERVER_GLOBAL ??= {});
