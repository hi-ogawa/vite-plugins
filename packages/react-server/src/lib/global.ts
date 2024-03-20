import type { RouterHistory } from "@tanstack/history";
import type { ViteDevServer } from "vite";
import type { CallServerCallback } from "./types";

export let __global: {
  history: RouterHistory;
  callServer: CallServerCallback;
  dev: {
    server: ViteDevServer;
    reactServer: ViteDevServer;
  };
} = ((globalThis as any).__REACT_SERVER_GLOBAL ??= {});
