import type { ViteDevServer } from "vite";
import type { CallServerCallback } from "./types";

// centeralize quick global hacks...

export const __global: {
  dev: {
    server: ViteDevServer;
    reactServer: ViteDevServer;
  };
  callServer: CallServerCallback;
  startTransition: React.TransitionStartFunction;
  startActionTransition: React.TransitionStartFunction;
} = ((globalThis as any).__REACT_SERVER_GLOBAL ??= {});
