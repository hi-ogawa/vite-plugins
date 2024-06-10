import type React from "react";
import type { ActionResult } from "../server-action/react-server";
import { type RouteType, toRouteId } from "./tree";

// TODO: rename
// TODO
// this indirection seems unnecessary?
// can client directly make use of layouts and pages data?
export type LayoutRequest = Record<
  string,
  {
    type: "page" | "layout";
    // TODO: rename to prefix
    name: string;
  }
>;

// pathname -> routeId
export type RouteMapping = Record<string, string>;

// routeId -> node
export type RouteEntries = Record<string, React.ReactNode>;

export type RouteDataKey = {
  type: RouteType;
  prefix: string;
};

export type RouteDataEntry = {
  type: RouteType;
  prefix: string;
  node: React.ReactNode;
};

export type ServerRouterData = {
  action?: Pick<ActionResult, "error" | "data">;
  entries: RouteDataEntry[];
  // entries: {
  //   layouts: Record<string, React.ReactNode>;
  //   pages: Record<string, React.ReactNode>;
  // };
  // result2?: {
  //   mapping: RouteMapping;
  //   entries2: RouteDataEntry[];
  // };
};

export const LAYOUT_ROOT_NAME = "__root";

export function getRouteMapping(pathname: string): RouteMapping {
  const map: RouteMapping = {};
  map[LAYOUT_ROOT_NAME] = toRouteId("layout", "/");
  const prefixes = getPathPrefixes(pathname);
  for (let i = 0; i < prefixes.length; i++) {
    const prefix = prefixes[i]!;
    if (i < prefixes.length - 1) {
      map[prefix] = toRouteId("layout", prefixes[i + 1]!);
    } else {
      map[prefix] = toRouteId("page", prefix);
    }
  }
  return map;
}

export function createLayoutContentRequest(pathname: string): LayoutRequest {
  const prefixes = getPathPrefixes(pathname);
  const map: LayoutRequest = {
    [LAYOUT_ROOT_NAME]: { type: "layout", name: "/" },
  };
  for (let i = 0; i < prefixes.length; i++) {
    const prefix = prefixes[i]!;
    if (i < prefixes.length - 1) {
      map[prefix] = {
        type: "layout",
        name: prefixes[i + 1]!,
      };
    } else {
      map[prefix] = {
        type: "page",
        name: prefix,
      };
    }
  }
  return map;
}

// TODO: this is bad. should return array of LayoutContentTarget
export function getNewLayoutContentKeys(prev: string, next: string): string[] {
  const prevMap = createLayoutContentRequest(prev);
  const nextMap = createLayoutContentRequest(next);
  return Object.keys(nextMap).filter(
    (k) =>
      nextMap[k]?.type === "page" ||
      JSON.stringify(nextMap[k]) !== JSON.stringify(prevMap[k]),
  );
}

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

// strip trailing slash
export function normalizePathname(pathname: string) {
  return pathname.replaceAll(/\/*$/g, "") || "/";
}
