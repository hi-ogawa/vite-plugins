import { objectMapValues, typedBoolean, uniq } from "@hiogawa/utils";
import { type BaseRouteEntry, type TreeNode, matchRouteTree } from "./tree";

export type RouteManifest = {
  routeTree: TreeNode<BaseRouteEntry<AssetDeps>>;
};

export function emptyRouteManifest(): RouteManifest {
  return { routeTree: {} };
}

export type AssetDeps = {
  js: string[];
  css: string[];
};

export function getRouteAssetDeps(
  manifest: RouteManifest,
  pathname: string,
): AssetDeps {
  const result = matchRouteTree(manifest.routeTree, pathname);
  const deps = result.matches.flatMap((m) => {
    const v = m.node.value;
    return [v?.page, v?.layout, v?.error].filter(typedBoolean);
  });
  return mergeAssetDeps(deps);
}

export function mergeAssetDeps(entries: AssetDeps[]): AssetDeps {
  const deps: AssetDeps = { js: [], css: [] };
  return objectMapValues(deps, (_v, k) => uniq(entries.flatMap((e) => e[k])));
}
