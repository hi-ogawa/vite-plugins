import { tinyassert } from "@hiogawa/utils";
import { type DataRouteObject, matchRoutes } from "react-router";
import type { Manifest } from "vite";
import type { RoutesMeta } from "../../route-utils";
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
}

let __preloadContext: PreloadContext | undefined;

export function setPreloadContext(v: PreloadContext) {
  __preloadContext = v;
}

function getPreloadContext() {
  tinyassert(__preloadContext, "forgot 'setPreloadContext'?");
  return __preloadContext;
}

function getRouteDependencies(page: string): RouteDependencies {
  const { routes, routesMeta, manifest } = getPreloadContext();
  const matches = matchRoutes(routes, page) ?? [];
  return resolveRouteDependenciesByIds(
    matches.map((m) => m.route.id),
    routesMeta,
    manifest
  );
}

// Vite's production build will wrap each dynamic import with `__vitePreload`,
// which will inject preload links for asset dependencies when such dynamic import is invoked.
async function preloadPageAssets(page: string) {
  const { routes } = getPreloadContext();
  const matches = matchRoutes(routes, page) ?? [];
  await Promise.all(matches.map(m => m.route.lazy?.()));
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
        injectPreloadLinks(e.target.href);
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
function injectPreloadLinks(href: string) {
  const url = new URL(href, window.location.href);

  // TODO: prefetch external links?
  if (url.host !== window.location.host) {
    return;
  }

  preloadPageAssets(url.pathname);
  if (1) {
    return;
  }

  // resolve page dependencies
  const deps = getRouteDependencies(url.pathname);
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
}
