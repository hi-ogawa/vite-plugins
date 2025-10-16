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
    writeAssetsManifest(): Promise<void>;
  }
}
