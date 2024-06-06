import React from "react";
import ReactDom from "react-dom";
import { useRouter } from "../../client";
import { ActionRedirectHandler } from "../server-action/client";
import {
  type AssetDeps,
  type RouteManifest,
  getRouteAssetDeps,
} from "./manifest";
import { LAYOUT_ROOT_NAME, type ServerRouterData } from "./utils";

type LayoutStateContextType = {
  data: ServerRouterData;
};

export const LayoutStateContext = React.createContext<LayoutStateContextType>(
  undefined!,
);

export function LayoutContent(props: { name: string }) {
  const ctx = React.useContext(LayoutStateContext);
  return ctx.data.layout[props.name];
}

export function LayoutRoot() {
  return (
    <>
      <LayoutContent name={LAYOUT_ROOT_NAME} />
      <ActionRedirectHandler />
    </>
  );
}

export const ROUTER_REVALIDATE_KEY = "__REVALIDATE";

export function routerRevalidate() {
  return { [ROUTER_REVALIDATE_KEY]: true };
}

function preloadAssetDeps(deps: AssetDeps) {
  for (const href of deps.js) {
    ReactDom.preloadModule(href);
  }
  for (const href of deps.css) {
    ReactDom.preload(href, { as: "style" });
  }
}

export function RouteAssetLinks() {
  const pathname = useRouter((s) => s.location.pathname);
  const routeManifest = React.useContext(RouteManifestContext);
  const deps = React.useMemo(
    () => getRouteAssetDeps(routeManifest, pathname),
    [pathname, routeManifest],
  );
  return (
    <>
      {deps.js.map((href) => (
        <link key={href} rel="modulepreload" href={href} />
      ))}
      {deps.css.map((href) => (
        // @ts-expect-error precedence to force head rendering
        // https://react.dev/reference/react-dom/components/link#special-rendering-behavior
        <link key={href} rel="stylesheet" href={href} precedence="high" />
      ))}
    </>
  );
}

export const RouteManifestContext = React.createContext<RouteManifest>(
  undefined!,
);

export function usePreloadHandlers({
  href,
  preload,
}: { href: string; preload?: boolean }) {
  const routeManifest = React.useContext(RouteManifestContext);
  const callback = React.useCallback(() => {
    if (!preload) return;

    const url = new URL(href, window.location.href);
    const deps = getRouteAssetDeps(routeManifest, url.pathname);
    preloadAssetDeps(deps);
  }, [href, preload, routeManifest]);

  return {
    onMouseEnter: callback,
    onTouchStart: callback,
    onFocus: callback,
  } satisfies JSX.IntrinsicElements["a"];
}
