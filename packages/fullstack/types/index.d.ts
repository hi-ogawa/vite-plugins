/// <reference path="./query.d.ts" />

import type { ImportAssetsOptions, ImportAssetsResult } from "./shared.ts";

declare global {
  interface ImportMeta {
    readonly vite: {
      /** @deprecated use `?assets` query import instead */
      assets(options?: ImportAssetsOptions): ImportAssetsResult;
    };
  }
}

declare module "vite" {
  interface ViteBuilder {
    /**
     * The plugin injects this method to allow flexible build pipeline
     * for downstream integrations. This will be automatically called during the plugin
     * post `buildApp` hook when it was not called by users.
     */
    writeAssetsManifest(): Promise<void>;
  }
}
