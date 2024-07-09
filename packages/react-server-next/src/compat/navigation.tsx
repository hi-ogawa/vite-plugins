"use client";

import {
  routerRevalidate,
  useLocation,
  useParams as useParams_,
  useRouter as useRouter_,
  useSelectedLayoutSegments as useSelectedLayoutSegments_,
} from "@hiogawa/react-server/client";
import React from "react";

export function useSearchParams() {
  return useLocation().searchParams;
}

export function usePathname() {
  return useLocation().pathname;
}

interface Params {
  /** @todo no array */
  [key: string]: string | string[];
}

export function useParams<T extends Params = Params>(): T {
  return useParams_() as any;
}

export function useSelectedLayoutSegments(
  /** @todo */
  _parallelRouteKey?: string,
): string[] {
  return useSelectedLayoutSegments_();
}

export function useSelectedLayoutSegment(
  /** @todo */
  _parallelRouteKey?: string,
): string | null {
  return useSelectedLayoutSegments_()[0] ?? null;
}

export function useRouter() {
  const history = useRouter_((s) => s.history);
  const refresh = () => {
    history.replace(window.location.href, routerRevalidate("/"));
  };
  return React.useMemo(() => ({ ...history, refresh }), [history]);
}

/** @todo */
export function useServerInsertedHTML(_callback: () => React.ReactNode): void {}

export type * from "./navigation.react-server";
