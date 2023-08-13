import { getRouteDependencies } from "@hiogawa/vite-glob-routes/dist/react-router/client";

// cf.
// https://github.com/remix-run/remix/blob/9ae3cee0e81ccb7259d6103df490b019e8c2fd94/packages/remix-react/components.tsx#L479
// https://kit.svelte.dev/docs/link-options#data-sveltekit-preload-data

export function createPreloadHandlerRef(options?: { href?: string }) {
  let handler: ((e: MouseEvent | TouchEvent) => void) | undefined;

  return (el: HTMLElement | null) => {
    if (handler) {
      el?.removeEventListener("mouseover", handler);
      el?.removeEventListener("touchstart", handler);
    }
    if (el) {
      handler = (e) => {
        let href =
          options?.href ??
          (e.target instanceof HTMLAnchorElement && e.target.href);
        if (href) {
          injectPagePrefetchLinks(href);
        }
      };
      el.addEventListener("mouseover", handler);
      el.addEventListener("touchstart", handler);
    }
  };
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
