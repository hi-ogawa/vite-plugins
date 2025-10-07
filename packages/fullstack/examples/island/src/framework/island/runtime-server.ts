// cf. astro preact integration
// https://github.com/withastro/astro/blob/63ca266b9039ed241ee5257d1b2e6b2337a041c9/packages/integrations/preact/src/server.ts

import type { ImportAssetsResult } from "@hiogawa/vite-plugin-fullstack/runtime";
import { type ComponentType, h } from "preact";
import { renderToStaticMarkup } from "preact-render-to-string";

export function createIsland(
  Component: ComponentType,
  exportName: string,
  assets: ImportAssetsResult,
): ComponentType {
  const Wrapper: ComponentType = (props) => {
    const markup = renderToStaticMarkup(h(Component, props));
    return h("demo-island", {
      entry: assets.entry,
      "export-name": exportName,
      props: JSON.stringify(props),
      dangerouslySetInnerHTML: { __html: markup },
    });
  };
  Object.defineProperty(Wrapper, "name", {
    value: Component.displayName || Component.name,
  });
  return Wrapper;
}
