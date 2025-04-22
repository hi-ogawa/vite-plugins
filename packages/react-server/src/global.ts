import type { ViteDevServer } from "vite";
import type { ModuleRunner } from "vite/module-runner";
import type { PluginStateManager } from "./plugin";

// centeralize quick global hacks...

export const $__global: {
  dev: {
    server: ViteDevServer;
    reactServerRunner: ModuleRunner;
    manager: PluginStateManager;
  };
} = ((globalThis as any).__REACT_SERVER_GLOBAL ??= {});
