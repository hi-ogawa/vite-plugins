import type { ModuleRunner } from "vite/module-runner";

export type CallServerCallback = (id: string, args: unknown[]) => unknown;

declare global {
  var __viteRscSsrRunner: ModuleRunner;
  var __viteRscCallServer: CallServerCallback;
}
