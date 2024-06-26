"use client";

import { useRouter as useRouter_ } from "@hiogawa/react-server/client";
import React from "react";

export function useSearchParams() {
  const search = useRouter_((s) => s.location.search);
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export function usePathname() {
  return useRouter_((s) => s.location.pathname);
}

/** @todo */
export function useParams(): Record<string, string | string[]> {
  return {};
}

/** @todo */
export function getSelectedLayoutSegmentPath(..._args: unknown[]): string[] {
  return [];
}

/** @todo */
export function useSelectedLayoutSegments(..._args: unknown[]): string[] {
  return [];
}

/** @todo */
export function useSelectedLayoutSegment(..._args: unknown[]): string | null {
  return null;
}

export function useRouter() {
  const history = useRouter_((s) => s.history);
  return history;
}

export type * from "./navigation.react-server";
