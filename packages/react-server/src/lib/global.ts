import type { ViteDevServer } from "vite";
import type { ErrorBoundary } from "../client-internal";
import type { CallServerCallback } from "./types";

// centeralize quick global escape hatch...

export const __global: {
  dev: {
    server: ViteDevServer;
    reactServer: ViteDevServer;
  };
  callServer: CallServerCallback;
  ErrorBoundary: typeof ErrorBoundary;
} = ((globalThis as any).__REACT_SERVER_GLOBAL ??= {});
