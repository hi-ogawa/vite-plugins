import React from "react";
import ReactDom from "react-dom";
import type { AssetDeps, PreloadManifest } from "./plugin";
import { getRouteAssetsDeps } from "./utils";

// global inject by ssr <script>
declare let __preloadManifest: PreloadManifest;

export function usePreloadHandlers(props: {
  href: string;
  prefetch?: boolean;
}) {
  // for now, client only since SSR injects preload links to head manually without react
  const enabled = useHydrated() && props.prefetch;
  const deps = React.useMemo(
    () =>
      enabled ? getRouteAssetsDeps(props.href, __preloadManifest) : undefined,
    [enabled, props.href],
  );

  if (!deps) {
    return {};
  }

  return {
    onMouseEnter: () => preloadAssetDeps(deps),
    onTouchStart: () => preloadAssetDeps(deps),
    onFocus: () => preloadAssetDeps(deps),
  } satisfies JSX.IntrinsicElements["a"];
}

export function SsrPreloadLinks(props: {
  pathname: string;
  preloadManifest: PreloadManifest;
}) {
  const deps = getRouteAssetsDeps(props.pathname, props.preloadManifest);
  preloadAssetDeps(deps);
  return null;
}

// https://tkdodo.eu/blog/avoiding-hydration-mismatches-with-use-sync-external-store#usesyncexternalstore
function useHydrated(): boolean {
  return React.useSyncExternalStore(
    React.useState(() => () => () => {})[0],
    () => true,
    () => false,
  );
}

function preloadAssetDeps(deps: AssetDeps) {
  for (const href of deps.js) {
    ReactDom.preloadModule(href);
  }
  for (const href of deps.css) {
    ReactDom.preload(href, { as: "style" });
  }
}
