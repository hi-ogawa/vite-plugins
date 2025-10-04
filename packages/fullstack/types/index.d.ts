/// <reference path="./query.d.ts" />

import type { ImportAssetsOptions, ImportAssetsResult } from "./shared.ts";

declare global {
  interface ImportMeta {
    readonly vite: {
      // TODO: sync or async?
      // if async, then we can probably remove eager `transformRequest` from `collectCss`.
      assets(options?: ImportAssetsOptions): ImportAssetsResult;
    };
  }

  interface ImportMetaEnv {
    readonly BUILD: boolean;
  }
}
