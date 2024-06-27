"use client";

import {
  routerRevalidate,
  useParams as useParams_,
  useRouter as useRouter_,
} from "@hiogawa/react-server/client";
import React from "react";

export function useSearchParams() {
  const search = useRouter_((s) => s.location.search);
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export function usePathname() {
  return useRouter_((s) => s.location.pathname);
}

interface Params {
  /** @todo no array */
  [key: string]: string | string[];
}

export function useParams<T extends Params = Params>(): T {
  return useParams_() as any;
}

/** @todo */
export function useSelectedLayoutSegments(_todo?: string): string[] {
  return [];
}

/** @todo */
export function useSelectedLayoutSegment(_todo?: string): string | null {
  return null;
}

export function useRouter() {
  const history = useRouter_((s) => s.history);
  const refresh = () => {
    history.replace(window.location.href, routerRevalidate());
  };
  return React.useMemo(() => ({ ...history, refresh }), [history]);
}

/** @todo */
export function useServerInsertedHTML(_callback: () => React.ReactNode): void {}

export type * from "./navigation.react-server";
