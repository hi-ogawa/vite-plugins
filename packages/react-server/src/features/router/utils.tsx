import type { ActionResult } from "../server-action/react-server";

export type LayoutRequest = Record<
  string,
  {
    type: "page" | "layout";
    name: string;
  }
>;

export type ServerRouterData = {
  action?: Pick<ActionResult, "error" | "data">;
  layout: Record<string, React.ReactNode>;
};

export const LAYOUT_ROOT_NAME = "__root";

export function createLayoutContentRequest(pathname: string) {
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

// TODO: remove
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
