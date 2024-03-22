import type { ViteDevServer } from "vite";
import type { CallServerCallback } from "./types";

// centeralize quick global escape hatch...

export const __global: {
  dev: {
    server: ViteDevServer;
    reactServer: ViteDevServer;
  };
  callServer: CallServerCallback;
  // TODO
  // for now, we workaround self-reference "@hiogawa/react-server/client-internal"
  // by passing via global from user code (Try Vite 5.2)
  clientInternal: typeof import("../client-internal");
  serverInternal: typeof import("../server-internal");
} = ((globalThis as any).__REACT_SERVER_GLOBAL ??= {});
