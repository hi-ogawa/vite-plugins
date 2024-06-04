import { routerRevalidate } from "../../client";
import { usePreloadHandlers } from "../../features/router/client";
import { useRouter } from "./router";

// TODO: study prior art
// https://github.com/TanStack/router/blame/a1030ef24de104eb32f7a781cda247458e0ec90a/packages/react-router/src/link.tsx
// https://github.com/remix-run/react-router/blob/9e7486b89e712b765d947297f228650cdc0c488e/packages/react-router-dom/index.tsx#L1394
// https://github.com/remix-run/remix/blob/6ad886145bd35298accf04d43bd6ef69833567e2/packages/remix-react/components.tsx#L121

interface LinkProps {
  revalidate?: boolean;
  activeProps?: JSX.IntrinsicElements["a"];
  preload?: boolean;
}

function encodeHref(href: string) {
  const url = new URL(href, "https://test.local");
  return url.href.slice(url.origin.length);
}

function matchHref(href: string, pathname: string) {
  pathname = pathname.replaceAll(/\/*$/g, "/");
  href = href.replaceAll(/\/*$/g, "/");
  return pathname.startsWith(href);
}

export function Link({
  revalidate,
  activeProps,
  preload,
  ...props
}: JSX.IntrinsicElements["a"] & { href: string } & LinkProps) {
  const history = useRouter((s) => s.history);
  const pathname = useRouter((s) => s.location.pathname);
  const href = encodeHref(props.href);
  const handlers = usePreloadHandlers({ href, preload });

  return (
    <a
      {...props}
      {...(matchHref(href, pathname) ? activeProps : {})}
      // TODO: merge handlers
      {...handlers}
      onClick={(e) => {
        const target = e.currentTarget.target;
        if (
          e.button === 0 &&
          !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) &&
          (!target || target === "_self")
        ) {
          e.preventDefault();
          history.push(href, revalidate ? routerRevalidate() : {});
        }
      }}
    />
  );
}

export function LinkForm({
  revalidate,
  activeProps,
  preload: _preload,
  ...props
}: JSX.IntrinsicElements["form"] & { action: string } & LinkProps) {
  const history = useRouter((s) => s.history);

  return (
    <form
      {...props}
      onSubmit={(e) => {
        e.preventDefault();
        // cf. react-router's getFormSubmissionInfo and normalizeNavigateOptions
        // https://github.com/remix-run/react-router/blob/00ffa36b0aa5f046239acbc7675c83c43bfb4e2a/packages/react-router-dom/dom.ts#L237
        // https://github.com/remix-run/react-router/blob/00ffa36b0aa5f046239acbc7675c83c43bfb4e2a/packages/router/router.ts#L3591-L3639
        const data = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        data.forEach((v, k) => {
          if (typeof v === "string") {
            params.set(k, v);
          }
        });
        const href = props.action + `?${params}`;
        history.push(href, revalidate ? routerRevalidate() : {});
      }}
    />
  );
}
