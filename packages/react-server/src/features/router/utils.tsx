import type { ActionResult } from "../server-action/server";
import type { MatchParamEntry } from "./tree";

// aka. FlightData
export type ServerRouterData = {
  action?: Pick<ActionResult, "error" | "data">;
  metadata?: React.ReactNode;
  nodeMap: Record<string, React.ReactNode>;
  layoutContentMap: Record<string, string>;
  params: MatchParamEntry[];
  url: string;
};

export const LAYOUT_ROOT_NAME = "__root";

/**
 * @example
 * "/" => ["/"]
 * "/a" => ["/", "/a"]
 * "/a/b" => ["/", "/a", "/a/b"]
 */
export function getPathPrefixes(pathname: string) {
  pathname = pathname.replaceAll(/\/*$/g, "");
  const keys = pathname.split("/");
  return keys.map((_key, i) => keys.slice(0, i + 1).join("/") || "/");
}

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
