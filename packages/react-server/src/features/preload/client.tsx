import React from "react";
import ReactDom from "react-dom";
import type { AssetDeps, PreloadManifest } from "./plugin";
import { getRouteAssetsDeps } from "./utils";

declare let __preloadManifest: PreloadManifest;

function usePreloadDeps(props: {
  href: string;
  prefetch?: boolean;
}): AssetDeps | undefined {
  // for now, build only
  if (import.meta.env.DEV) {
    return;
  }

  // for now, client only since SSR injects preload links to head manually without react
  const hydrated = useHydrated();
  const enabled = props.prefetch && hydrated;

  return React.useMemo(
    () =>
      enabled ? getRouteAssetsDeps(props.href, __preloadManifest) : undefined,
    [enabled, props.href],
  );
}

export function usePreloadHandlers(props: {
  href: string;
  prefetch?: boolean;
}) {
  const deps = usePreloadDeps(props);

  function preload() {
    if (!deps) {
      return;
    }
    // TODO: do this in react-server handler?
    for (const href of deps.js) {
      ReactDom.preloadModule(href);
    }
    for (const href of deps.css) {
      ReactDom.preload(href, { as: "style" });
    }
  }

  return {
    onMouseEnter: () => preload(),
    onTouchStart: () => preload(),
    onFocus: () => preload(),
  } satisfies JSX.IntrinsicElements["a"];
}

// https://tkdodo.eu/blog/avoiding-hydration-mismatches-with-use-sync-external-store#usesyncexternalstore
function useHydrated(): boolean {
  return React.useSyncExternalStore(
    React.useState(() => () => () => {})[0],
    () => true,
    () => false,
  );
}
