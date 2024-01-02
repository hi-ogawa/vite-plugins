import { type DataRouteObject, matchRoutes } from "react-router";

interface PreloadContext {
  routes: DataRouteObject[];
}

// Vite's production build will wrap each dynamic import with `__vitePreload`,
// which will inject preload links for asset dependencies when such dynamic import is invoked.
async function preloadCode(ctx: PreloadContext, page: string) {
  const matches = matchRoutes(ctx.routes, page) ?? [];
  await Promise.all(matches.map((m) => m.route.lazy?.()));
}

//
// helper to globally setup preload handler for <a href="..." date-preload />
//
// cf.
// https://github.com/remix-run/remix/blob/9ae3cee0e81ccb7259d6103df490b019e8c2fd94/packages/remix-react/components.tsx#L479
// https://kit.svelte.dev/docs/link-options#data-sveltekit-preload-data
//

export function setupPreload(ctx: PreloadContext) {
  // TODO: not sure perf impact of global "mouseover" and "touchstart"
  function handler(e: MouseEvent | TouchEvent) {
    if (e.target instanceof HTMLAnchorElement) {
      const dataPreload = e.target.getAttribute("data-preload");
      if (dataPreload) {
        const url = new URL(e.target.href, window.location.href);
        if (url.host === window.location.host) {
          preloadCode(ctx, url.pathname);
        }
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
