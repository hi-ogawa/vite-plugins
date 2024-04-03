import React from "react";
import type { AppMetadata, AssetDeps } from "./plugin";
import { getRouteAssetsDeps } from "./utils";

declare let __preloadManifest: AppMetadata;

function usePreloadDeps(pathname: string): AssetDeps {
  // for now, build only
  if (import.meta.env.DEV) {
    return { js: [], css: [] };
  }

  // for now, client only since SSR injects preload links to head manually without react
  if (!useHydrated()) {
    return { js: [], css: [] };
  }

  return React.useMemo(
    () => getRouteAssetsDeps(pathname, __preloadManifest),
    [pathname],
  );
}

export function PreloadLinks(props: { pathname: string }) {
  const deps = usePreloadDeps(props.pathname);
  return (
    <>
      {deps.js.map((href) => (
        <link rel="modulepreload" href={href} />
      ))}
      {deps.css.map((href) => (
        <link rel="preload" as="style" href={href} />
      ))}
    </>
  );
}

// https://tkdodo.eu/blog/avoiding-hydration-mismatches-with-use-sync-external-store#usesyncexternalstore
function useHydrated(): boolean {
  return React.useSyncExternalStore(
    React.useState(() => () => () => {})[0],
    () => true,
    () => false,
  );
}
