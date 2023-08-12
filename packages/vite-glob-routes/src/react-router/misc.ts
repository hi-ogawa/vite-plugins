import { tinyassert, typedBoolean } from "@hiogawa/utils";
import { type DataRouteMatch } from "react-router";
import type { createStaticHandler } from "react-router-dom/server";
import type { Manifest } from "vite";
import { mapValues } from "../utils";
import type { RoutesMeta } from "./route-utils";

// typings from "@remix-run/router"
// for now just derive it from "react-router" exports
export type RouterStaticHandler = ReturnType<typeof createStaticHandler>;

//
// extra runtime route data to pass from server to client
// for complete SSR experience (which are not provided by react-router yet)
//

export interface ExtraRouterInfo {
  // need to resolve lazy route of initial routes before hydration on client (cf. initializeClientRoutes)
  matches: SerializedMatch[];
  // client can use this to auto inject `proxyServerLoader` for the page with server loader.
  // note that client cannot known this during "build" time since we build client before server.
  // also "file" mapping data will be needed to implement client-side link prefetching.
  routesMeta: SerializedRoutesMeta;
  // for release build, extra mapping is required e.g. for link prefetching.
  // (TODO: technically such mapping can be done only once on server, so passing whole manifest is not necessary.)
  manifest?: Manifest;
}

export const KEY_extraRouterInfo = "__globRoutes__ExtraRouterInfo";

type SerializedMatch = ReturnType<typeof serializeMatch>;

export function serializeMatch(match: DataRouteMatch) {
  return {
    route: {
      id: match.route.id,
    },
  };
}

type SerializedRoutesMeta = ReturnType<typeof serializeRoutesMata>;

export function serializeRoutesMata(routesMeta: RoutesMeta) {
  return mapValues(routesMeta, (v) => ({
    exports: Object.keys(v.route),
    entries: v.entries.map((e) => ({
      file: e.file,
      isServer: e.isServer,
    })),
  }));
}

//
// server handing-off data to client via global script
//

export function createGlobalScript(key: string, data: unknown) {
  // TODO: need more intricate escape? cf. https://github.com/remix-run/react-router/blob/5b1765f54ee1f769b23c4ded3ad02f04a34e636e/packages/react-router-dom/server.tsx#L120-L125
  return `<script>window.${key} = ${JSON.stringify(data)}</script>`;
}

export function getGlobalScriptData(key: string): unknown {
  tinyassert(typeof window !== "undefined");
  return (window as any)[key];
}

//
// asset prefetching
//

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
