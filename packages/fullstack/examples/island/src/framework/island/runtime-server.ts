import type { ImportAssetsResult } from "@hiogawa/vite-plugin-fullstack/runtime";
import { type ComponentType, h } from "preact";

export function defineIsland(
  Component: ComponentType,
  exportName: string,
  assets: ImportAssetsResult,
): ComponentType {
  const Wrapper: ComponentType = (props) => {
    return h(
      "demo-island",
      {
        entry: assets.entry,
        "export-name": exportName,
        props: JSON.stringify(props),
      },
      h(Component, props),
    );
  };
  Object.defineProperty(Wrapper, "name", {
    value: Component.displayName || Component.name,
  });
  return Wrapper;
}
