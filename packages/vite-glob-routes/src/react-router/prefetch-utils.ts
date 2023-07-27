export function getPreloadLink(href: string) {
  return `<link rel="modulepreload" href="${href}" />`;
}

export function resolveAssetPathsByRouteId(
  routeId: string,
  extraRouterInfo: ExtraRouterInfo
) {
  const { routesMeta, manifest } = extraRouterInfo;

  let files =
    routesMeta[routeId]?.entries
      .map((e) => !e.isServer && e.file)
      .filter(typedBoolean) ?? [];

  if (manifest) {
    files = resolveManifestAssets(files, manifest);
  }

  return files;
}

// general vite manifest utility to map production asset
function resolveManifestAssets(files: string[], manifest: Manifest) {
  const entryKeys = new Set<string>();

  function collectEnryKeysRecursive(key: string) {
    if (!entryKeys.has(key)) {
      const e = manifest[key];
      tinyassert(e);
      entryKeys.add(key);
      for (const nextKey of e.imports ?? []) {
        collectEnryKeysRecursive(nextKey);
      }
      // TODO: css?
      e.css;
    }
  }

  for (const file of files) {
    // strip "/"
    collectEnryKeysRecursive(file.slice(1));
  }

  return [...entryKeys].map((key) => "/" + manifest[key]!.file);
}
