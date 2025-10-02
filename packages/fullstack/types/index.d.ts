import type { ImportAssetsOptions, ImportAssetsResult } from "./shared.ts";

declare global {
  interface ImportMeta {
    readonly vite: {
      // TODO: sync or async?
      assets(options?: ImportAssetsOptions): ImportAssetsResult;
    };
  }

  interface ImportMetaEnv {
    readonly BUILD: boolean;
  }
}

export { ImportAssetsResult };
