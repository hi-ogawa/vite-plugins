export type LayoutRequest = Record<
  string,
  {
    type: "page" | "layout";
    name: string;
  }
>;

export type ServerLayoutData = Record<string, React.ReactNode>;

export type ClientLayoutData = Record<string, Promise<React.ReactNode>>;

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
