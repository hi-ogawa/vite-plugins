import { getPathPrefixes } from "../../lib/utils";
import type { LayoutContentRequest } from "./layout-manager";

export const LAYOUT_ROOT_NAME = "__root";

export function createLayoutContentRequest(pathname: string) {
  const parts = getPathPrefixes(pathname);
  const map: LayoutContentRequest = {
    [LAYOUT_ROOT_NAME]: { type: "layout", name: "" },
  };
  for (let i = 0; i < parts.length; i++) {
    const [prefix] = parts[i]!;
    if (i < parts.length - 1) {
      map[prefix] = {
        type: "layout",
        name: parts[i + 1]![0],
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
