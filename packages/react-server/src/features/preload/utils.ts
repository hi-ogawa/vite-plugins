import { objectMapValues, typedBoolean } from "@hiogawa/utils";
import { matchRouteTree } from "../../utils/tree";
import type { AssetDeps, BuildMetadata } from "./plugin";

export function getRouteAssetsDeps(
  pathname: string,
  manifest: BuildMetadata,
): AssetDeps {
  const result = matchRouteTree(manifest.routeTree, pathname);
  const deps = result.nodes
    .flatMap((n) => [n.value?.page, n.value?.layout, n.value?.error])
    .filter(typedBoolean);
  return mergeAssetDeps(deps);
}

export function mergeAssetDeps(entries: AssetDeps[]): AssetDeps {
  const deps: AssetDeps = { js: [], css: [] };
  return objectMapValues(deps, (_v, k) => entries.flatMap((e) => e[k]));
}
