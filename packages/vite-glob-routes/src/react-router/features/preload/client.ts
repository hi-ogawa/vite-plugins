import { tinyassert } from "@hiogawa/utils";
import { type DataRouteObject, matchRoutes } from "react-router";
import type { Manifest } from "vite";
import type { RoutesMeta } from "../../route-utils";
import {
  type RouteDependencies,
  mergeRouteDependencies,
  resolveRouteDependenciesById,
} from "./shared";

// simple global system on our own convention
// instead of using React.Context

export interface PreloadContext {
  routes: DataRouteObject[];
  routesMeta: RoutesMeta;
  manifest?: Manifest;
}

let __preloadContext: PreloadContext | undefined;

export function setPreloadContext(v: PreloadContext) {
  __preloadContext = v;
}

export function getPreloadContext() {
  tinyassert(__preloadContext, "forgot 'setPreloadContext'?");
  return __preloadContext;
}

export function getRouteDependencies(page: string): RouteDependencies {
  const { routes, routesMeta, manifest } = getPreloadContext();
  const matches = matchRoutes(routes, page) ?? [];
  const deps = matches.map((m) =>
    resolveRouteDependenciesById(m.route.id, routesMeta, manifest)
  );
  return mergeRouteDependencies(deps);
}
