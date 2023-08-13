import { getRouteDependencies } from "@hiogawa/vite-glob-routes/dist/react-router/client";
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export function Component() {
  useGlobalPagePrefetchHandler();

  return (
    <div>
      <header>
        <h4>Routes</h4>
        <ul>
          {LINKS.map(([href, label]) => (
            <li key={href}>
              <NavLink
                to={href}
                style={(x) => (x.isActive ? { fontWeight: "bold" } : {})}
                data-prefetch
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </header>
      <div>
        <Outlet />
      </div>
    </div>
  );
}

const LINKS = [
  ["/", "Index Page"],
  ["/pokemon", "Pokemon API Demo"],
] as const;

// page prefetching helper
// copied from packages/demo/src/routes/layout.tsx

// cf. https://github.com/remix-run/remix/blob/9ae3cee0e81ccb7259d6103df490b019e8c2fd94/packages/remix-react/components.tsx#L479
function useGlobalPagePrefetchHandler() {
  React.useEffect(() => {
    // TODO: not sure perf impact of global "mouseover"
    function handler(e: MouseEvent | TouchEvent) {
      if (e.target instanceof HTMLAnchorElement) {
        const dataPrefetch = e.target.getAttribute("data-prefetch");
        if (dataPrefetch) {
          // e.target.href always full url?
          injectPagePrefetchLinks(e.target.href);
        }
      }
    }

    document.addEventListener("mouseover", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mouseover", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);
}

// TODO: memoize?
function injectPagePrefetchLinks(href: string) {
  const url = new URL(href, window.location.href);

  // TODO: prefetch external links?
  if (url.host !== window.location.host) {
    return;
  }

  // resolve page dependencies
  const links = getRouteDependencies(url.pathname);
  for (const href of links.js) {
    // TODO: escapeHtml
    const found = document.body.querySelector(`link[href="${href}"]`);
    if (!found) {
      const el = document.createElement("link");
      el.setAttribute("rel", "modulepreload");
      el.setAttribute("href", href);
      document.body.appendChild(el);
    }
  }
}
