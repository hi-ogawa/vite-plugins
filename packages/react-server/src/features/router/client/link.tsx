import { objectMapValues } from "@hiogawa/utils";
import React from "react";
import { routerRevalidate } from "../../../client";
import type { RevalidationType } from "../../server-component/utils";
import { usePreloadHandlers } from "../client";
import { useRouter } from "./router";

// TODO: study prior art
// https://github.com/TanStack/router/blob/a1030ef24de104eb32f7a781cda247458e0ec90a/packages/react-router/src/link.tsx
// https://github.com/remix-run/react-router/blob/9e7486b89e712b765d947297f228650cdc0c488e/packages/react-router-dom/index.tsx#L1394
// https://github.com/remix-run/remix/blob/6ad886145bd35298accf04d43bd6ef69833567e2/packages/remix-react/components.tsx#L121

interface LinkProps {
  revalidate?: RevalidationType;
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

  return (
    <a
      {...mergeProps(
        {
          ...props,
          ...(matchHref(href, pathname) ? activeProps : {}),
        },
        {
          ...usePreloadHandlers({ href, preload }),
          onClick: (e) => {
            const target = e.currentTarget.target;
            if (
              e.button === 0 &&
              !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) &&
              (!target || target === "_self")
            ) {
              e.preventDefault();
              history.push(
                href,
                revalidate ? routerRevalidate(revalidate) : {},
              );
            }
          },
        } satisfies JSX.IntrinsicElements["a"],
      )}
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

  // cf. react-router's getFormSubmissionInfo and normalizeNavigateOptions
  // https://github.com/remix-run/react-router/blob/00ffa36b0aa5f046239acbc7675c83c43bfb4e2a/packages/react-router-dom/dom.ts#L237
  // https://github.com/remix-run/react-router/blob/00ffa36b0aa5f046239acbc7675c83c43bfb4e2a/packages/router/router.ts#L3591-L3639
  return (
    <form
      {...mergeProps(props, {
        onSubmit: (e) => {
          e.preventDefault();
          const url = new URL(e.currentTarget.action);
          const data = new FormData(e.currentTarget);
          data.forEach((v, k) => {
            if (typeof v === "string") {
              url.searchParams.set(k, v);
            }
          });
          history.push(
            url.href.slice(url.origin.length),
            revalidate ? routerRevalidate(revalidate) : {},
          );
        },
      } satisfies JSX.IntrinsicElements["form"])}
    />
  );
}

function mergeHandlers(
  ...handlers: (Function | undefined)[]
): (e: React.SyntheticEvent) => void {
  return (e) => {
    for (const handler of handlers) {
      if (e.isPropagationStopped()) break;
      if (handler) handler(e);
    }
  };
}

function mergeProps(
  props1: Record<string, unknown>,
  props2: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...props1,
    ...objectMapValues(props2, (v2, k) => {
      const v1 = props1[k];
      return (typeof v1 === "undefined" || typeof v1 === "function") &&
        (typeof v2 === "undefined" || typeof v2 === "function")
        ? mergeHandlers(v1, v2)
        : v2;
    }),
  };
}
