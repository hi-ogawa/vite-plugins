import type { ActionResult } from "../server-action/server";
import type { MatchSegment } from "./tree";

export type FlightData = {
  action?: Pick<ActionResult, "error" | "data">;
  metadata?: React.ReactNode;
  nodeMap: Record<string, React.ReactNode>;
  layoutContentMap: Record<string, string>;
  segments: MatchSegment[];
  url: string;
};

export const LAYOUT_ROOT_NAME = "__root";

// enforce no trailing slash for simplicity
export function handleTrailingSlash(url: URL) {
  const normalized = url.pathname.replaceAll(/\/*$/g, "") || "/";
  if (normalized !== url.pathname) {
    return new Response(null, {
      status: 308,
      headers: {
        "x-handle-trailing-slash": "1",
        location: normalized + url.search,
      },
    });
  }
  return;
}

/**
 * @example
 * isAncestorPath("/x", "/x") === true
 * isAncestorPath("/x", "/x/y") === true
 * isAncestorPath("/x", "/xx/y") === false
 */
export function isAncestorPath(p1: string, p2: string) {
  // check prefix after trailing slash
  return p2.replace(/\/*$/, "/").startsWith(p1.replace(/\/*$/, "/"));
}

/**
 * @example
 * "/" => [""]
 * "/a" => ["", "a"]
 * "/a/b" => ["", "a", "b"]
 */
export function splitToSegments(pathname: string): string[] {
  return pathname === "/" ? [""] : pathname.split("/");
}

/** reverse of `splitToSegments` */
export function joinSegments(segments: string[]): string {
  return segments.join("/") || "/";
}
