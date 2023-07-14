import internalEager from "virtual:@hiogawa/vite-glob-routes/internal/page-routes";
import internalLazy from "virtual:@hiogawa/vite-glob-routes/internal/page-routes/lazy";
import {
  type GlobPageRoutesUserOptions,
  createGlobPageRoutes,
} from "./react-router-utils";

// TODO: proper peer-dependency version range

// TODO: rename exports to
// globPageRoutesClient
// globPageRoutesClientLazy
// globPageRoutesServer

// provide "react-router" RouterObject (only type dependency)
export function globPageRoutes(options?: GlobPageRoutesUserOptions) {
  return createGlobPageRoutes(internalEager, options ?? {});
}

export function globPageRoutesLazy(options?: GlobPageRoutesUserOptions) {
  return createGlobPageRoutes(internalLazy, options ?? {});
}

// provide helpers for standard SSR setup (depends on "react-router-dom")
export {
  handleReactRouterServer,
  getCurrentRouteAssets,
} from "./react-router-helper-server";

export {
  initializeReactRouterClient,
  proxyServerLoader,
} from "./react-router-helper-client";

export type {
  RouteObjectWithGlobInfo,
  GlobPageRoutesResult,
} from "./react-router-utils";
