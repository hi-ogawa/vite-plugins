import { tinyassert } from "@hiogawa/utils";
import type { HistoryState } from "@tanstack/history";
import React from "react";
import ReactDom from "react-dom";
import { useRouter } from "../../client";
import { ActionRedirectHandler } from "../server-action/client";
import type { RevalidationType } from "../server-component/utils";
import {
  type AssetDeps,
  type RouteManifest,
  getRouteAssetDeps,
} from "./manifest";
import { type MatchParamEntry, toMatchParamsObject } from "./tree";
import { LAYOUT_ROOT_NAME, type ServerRouterData } from "./utils";

type LayoutStateContextType = {
  data: Promise<ServerRouterData>;
};

export const LayoutStateContext = React.createContext<LayoutStateContextType>(
  undefined!,
);

export function LayoutContent(props: { name: string }) {
  const ctx = React.useContext(LayoutStateContext);
  const data = React.use(ctx.data);
  const routeId = data.layoutContentMap[props.name];
  tinyassert(routeId, `Unexpected layout content map`);
  return data.nodeMap[routeId];
}

export function LayoutRoot() {
  return (
    <>
      <LayoutContent name={LAYOUT_ROOT_NAME} />
      <ActionRedirectHandler />
      <MetadataRenderer />
    </>
  );
}

function MetadataRenderer() {
  const ctx = React.useContext(LayoutStateContext);
  const data = React.use(ctx.data);
  return data.metadata;
}

// TODO: should we remove confusing `useRouter(s => s.location)`?
export function useLocation() {
  const ctx = React.useContext(LayoutStateContext);
  const data = React.use(ctx.data);
  return React.useMemo(() => new URL(data.url), [data.url]);
}

function useParamEntries() {
  const ctx = React.useContext(LayoutStateContext);
  const data = React.use(ctx.data);
  return data.params;
}

export function useParams() {
  const entries = useParamEntries();
  return React.useMemo(() => toMatchParamsObject(entries), [entries]);
}

type LayoutMatchType = {
  params: MatchParamEntry[];
};

const LayoutMatchContext = React.createContext<LayoutMatchType>(undefined!);

export function LayoutMatchProvider(
  props: React.ComponentProps<typeof LayoutMatchContext.Provider>,
) {
  return <LayoutMatchContext.Provider {...props} />;
}

function useSelectedParamEntries() {
  const all = useParamEntries();
  const prefix = React.useContext(LayoutMatchContext).params;
  return React.useMemo(() => all.slice(prefix.length), [all, prefix]);
}

export function useSelectedLayoutSegments(): string[] {
  const entries = useSelectedParamEntries();
  return React.useMemo(() => entries.map(([_k, v]) => v), [entries]);
}

export function RemountRoute(props: React.PropsWithChildren) {
  const key = useSelectedLayoutSegments()[0];
  return <React.Fragment key={key}>{props.children}</React.Fragment>;
}

export const ROUTER_REVALIDATE_KEY = "__REVALIDATE";

declare module "@tanstack/history" {
  interface HistoryState {
    [ROUTER_REVALIDATE_KEY]?: RevalidationType;
  }
}

export function routerRevalidate(v: string | boolean = true): HistoryState {
  return { [ROUTER_REVALIDATE_KEY]: v };
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
