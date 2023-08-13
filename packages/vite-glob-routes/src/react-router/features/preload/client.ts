import { intersection, tinyassert } from "@hiogawa/utils";
import { type DataRouteObject, matchRoutes } from "react-router";
import type { Manifest } from "vite";
import type { RoutesMeta } from "../../route-utils";
import { LOADER_ROUTE_ID_PARAM } from "../data-request/shared";
import {
  type RouteDependencies,
  resolveRouteDependenciesByIds,
} from "./shared";

// simple global system on our own convention
// instead of using React.Context

interface PreloadContext {
  routes: DataRouteObject[];
  routesMeta: RoutesMeta;
  manifest?: Manifest;
  serverLoaderRouteIds?: string[];
}

let __preloadContext: PreloadContext | undefined;

export function setPreloadContext(v: PreloadContext) {
  __preloadContext = v;
}

function getPreloadContext() {
  tinyassert(__preloadContext, "forgot 'setPreloadContext'?");
  return __preloadContext;
}

function getRouteDependencies(url: URL): RouteDependencies {
  const { routes, routesMeta, manifest, serverLoaderRouteIds } =
    getPreloadContext();

  const matches = matchRoutes(routes, url.pathname) ?? [];
  const routeIds = matches.map((m) => m.route.id);
  const result = resolveRouteDependenciesByIds(routeIds, routesMeta, manifest);

  if (serverLoaderRouteIds) {
    result.data = intersection(routeIds, serverLoaderRouteIds).map((id) => {
      const newUrl = new URL(url);
      newUrl.searchParams.set(LOADER_ROUTE_ID_PARAM, id);
      return newUrl.toString().slice(url.origin.length);
    });
  }
  return result;
}

//
// helper to globally setup preload handler for <a href="..." date-preload />
//
// cf.
// https://github.com/remix-run/remix/blob/9ae3cee0e81ccb7259d6103df490b019e8c2fd94/packages/remix-react/components.tsx#L479
// https://kit.svelte.dev/docs/link-options#data-sveltekit-preload-data
//

export function setupGlobalPreloadHandler() {
  // TODO: not sure perf impact of global "mouseover" and "touchstart"
  function handler(e: MouseEvent | TouchEvent) {
    if (e.target instanceof HTMLAnchorElement) {
      const dataPreload = e.target.getAttribute("data-preload");
      if (dataPreload) {
        // e.target.href always full url?
        const url = new URL(e.target.href, window.location.origin);
        injectPreloadLinks(url);
      }
    }
  }

  document.addEventListener("mouseover", handler);
  document.addEventListener("touchstart", handler);

  return () => {
    document.removeEventListener("mouseover", handler);
    document.removeEventListener("touchstart", handler);
  };
}

// TODO: memoize?
function injectPreloadLinks(url: URL) {
  // TODO: prefetch external links?
  if (url.host !== window.location.host) {
    return;
  }

  // resolve page dependencies
  const deps = getRouteDependencies(url);
  for (const href of deps.js) {
    // TODO: escapeHtml
    const found = document.querySelector(`link[href="${href}"]`);
    if (!found) {
      const el = document.createElement("link");
      el.setAttribute("rel", "modulepreload");
      el.setAttribute("href", href);
      document.body.appendChild(el);
    }
  }

  for (const href of deps.css) {
    const found = document.querySelector(`link[href="${href}"]`);
    if (!found) {
      const el = document.createElement("link");
      el.setAttribute("rel", "preload");
      el.setAttribute("as", "style");
      el.setAttribute("href", href);
      document.body.appendChild(el);
    }
  }

  for (const href of deps.data ?? []) {
    const found = document.querySelector(`link[href="${href}"]`);
    if (!found) {
      const el = document.createElement("link");
      el.setAttribute("rel", "preload");
      el.setAttribute("as", "fetch");
      el.setAttribute("href", href);
      document.body.appendChild(el);
    }
  }
}
