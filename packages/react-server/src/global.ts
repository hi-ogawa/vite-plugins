import type { ViteDevServer } from "vite";
import type { ModuleRunner } from "vite/module-runner";
import type { PluginStateManager } from "./plugin";
import type { CallServerCallback } from "./types/react";

// centeralize quick global hacks...

export const $__global: {
  dev: {
    server: ViteDevServer;
    // reactServer: ViteDevServer;
    reactServerRunner: ModuleRunner;
    manager: PluginStateManager;
  };
  callServer: CallServerCallback;
} = ((globalThis as any).__REACT_SERVER_GLOBAL ??= {});
