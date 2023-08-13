import { tinyassert, typedBoolean, uniq } from "@hiogawa/utils";
import type { Manifest } from "vite";
import type { RoutesMeta } from "../../route-utils";

export type RouteDependencies = {
  js: string[];
  css: string[]; // TODO: not tested yet
  // data?: string[]; // TODO: data request too?
};

function mergeRouteDependencies(ls: RouteDependencies[]): RouteDependencies {
  return {
    js: uniq(ls.flatMap((e) => e.js)),
    css: uniq(ls.flatMap((e) => e.css)),
  };
}

export function resolveRouteDependenciesByIds(
  routeIds: string[],
  routesMeta: RoutesMeta,
  manifest?: Manifest
): RouteDependencies {
  return mergeRouteDependencies(
    routeIds.map((id) => resolveRouteDependenciesById(id, routesMeta, manifest))
  );
}

function resolveRouteDependenciesById(
  routeId: string,
  routesMeta: RoutesMeta,
  manifest?: Manifest
): RouteDependencies {
  const files =
    routesMeta[routeId]?.entries
      .map((e) => !e.isServer && e.file)
      .filter(typedBoolean) ?? [];
  if (manifest) {
    return resolveManifestEntries(files, manifest);
  }
  return { js: files, css: [] };
}

// need to probe vite client manifest to map production asset url
function resolveManifestEntries(
  files: string[],
  manifest: Manifest
): RouteDependencies {
  const entryKeys = new Set<string>();

  function collectEnryKeysRecursive(key: string) {
    if (!entryKeys.has(key)) {
      const e = manifest[key];
      tinyassert(e);
      entryKeys.add(key);
      for (const nextKey of e.imports ?? []) {
        collectEnryKeysRecursive(nextKey);
      }
    }
  }

  for (const file of files) {
    // strip "/"
    collectEnryKeysRecursive(file.slice(1));
  }

  const result: RouteDependencies = {
    js: [],
    css: [],
  };

  for (const key of entryKeys) {
    const e = manifest[key];
    tinyassert(e);
    result.js.push(`/${e.file}`);
    if (e.css) {
      result.css.push(...e.css.map((file) => `/${file}`));
    }
  }

  return result;
}
