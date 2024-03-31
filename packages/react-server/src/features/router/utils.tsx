import { getPathPrefixes } from "../../lib/utils";
import type { LayoutContentRequest } from "./layout-manager";

export const LAYOUT_ROOT_NAME = "__root";

// TODO: test
// TODO: keep common prefix when navigating
export function solveLayoutContentMapping(pathname: string) {
  const parts = getPathPrefixes(pathname);
  const mapping: LayoutContentRequest = {};
  for (let i = 0; i < parts.length; i++) {
    const [prefix] = parts[i]!;
    if (i < parts.length - 1) {
      mapping[prefix] = {
        type: "layout",
        name: parts[i + 1]![0],
      };
    } else {
      mapping[prefix] = {
        type: "page",
        name: prefix,
      };
    }
  }
  mapping[LAYOUT_ROOT_NAME] = { type: "layout", name: "" };
  return { mapping };
}
