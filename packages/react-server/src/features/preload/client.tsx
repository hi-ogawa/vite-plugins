import ReactDom from "react-dom";
import type { AssetDeps, PreloadManifest } from "./plugin";
import { getRouteAssetsDeps } from "./utils";

// global inject by ssr <script>
declare let __preloadManifest: PreloadManifest;

export function getPreloadHandlers(href: string) {
  if (typeof __preloadManifest === "undefined") {
    return {};
  }
  const url = new URL(href, window.location.origin);
  const deps = getRouteAssetsDeps(url.pathname, __preloadManifest);
  return {
    onMouseEnter: () => preloadAssetDeps(deps),
    onTouchStart: () => preloadAssetDeps(deps),
    onFocus: () => preloadAssetDeps(deps),
  } satisfies JSX.IntrinsicElements["a"];
}

export function ServerPreloadLinks(props: {
  pathname: string;
  preloadManifest: PreloadManifest;
}) {
  const deps = getRouteAssetsDeps(props.pathname, props.preloadManifest);
  preloadAssetDeps(deps);
  return null;
}

function preloadAssetDeps(deps: AssetDeps) {
  for (const href of deps.js) {
    ReactDom.preloadModule(href);
  }
  for (const href of deps.css) {
    ReactDom.preload(href, { as: "style" });
  }
}
