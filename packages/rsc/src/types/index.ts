import type { ModuleRunner } from "vite/module-runner";

export interface ImportManifestEntry {
  id: string;
  name: string;
  chunks: string[];
  async?: boolean;
}

export interface BundlerConfig {
  [bundlerId: string]: ImportManifestEntry;
}

export type ModuleMap = {
  [id: string]: {
    [exportName: string]: ImportManifestEntry;
  };
};

export interface ServerConsumerManifest {
  moduleMap?: ModuleMap;
  serverModuleMap?: BundlerConfig;
  moduleLoading?: {
    prefix: string;
    crossOriign?: string;
  };
}

export type CallServerCallback = (id: string, args: unknown[]) => unknown;

declare global {
  var __viteRscSsrRunner: ModuleRunner;
  var __viteRscCallServer: CallServerCallback;
}

export type ServerAssets = {
  js: string[];
  css: string[];
};
