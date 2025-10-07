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

declare module "virtual:fullstack/no-split-css" {
  type CssLinkAttributes = {
    href: string;
    "data-vite-dev-id"?: string;
  };
  const css: CssLinkAttributes[];
  export default css;
}
