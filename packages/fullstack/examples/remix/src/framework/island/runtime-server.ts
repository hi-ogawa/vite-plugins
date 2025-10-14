// cf. astro preact integration
// https://github.com/withastro/astro/blob/63ca266b9039ed241ee5257d1b2e6b2337a041c9/packages/integrations/preact/src/server.ts

import type { ImportAssetsResult } from "@hiogawa/vite-plugin-fullstack/runtime";
import { type Remix, hydrated } from "@remix-run/dom";

export function createIsland(
  Component: Remix.Component,
  exportName: string,
  assets: ImportAssetsResult,
) {
  return hydrated(`${assets.entry!}#${exportName}`, Component as any);
}
