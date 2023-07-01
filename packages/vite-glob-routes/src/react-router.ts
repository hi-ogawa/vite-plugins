import internalEager from "virtual:@hiogawa/vite-glob-routes/internal/page-routes";
import internalLazy from "virtual:@hiogawa/vite-glob-routes/internal/page-routes/lazy";
import { createGlobPageRoutes } from "./react-router-utils";

// TODO: proper peer-dependency version range

// provide "react-router" RouterObject (only type dependency)
export function globPageRoutes() {
  return createGlobPageRoutes(internalEager);
}

export function globPageRoutesLazy() {
  return createGlobPageRoutes(internalLazy);
}

// provide helpers for standard SSR setup (depends on "react-router-dom")
export {
  handleReactRouterServer,
  getCurrentRouteAssets,
} from "./react-router-helper-server";
export { initializeReactRouterClient } from "./react-router-helper-client";
export type { RouteObjectWithGlobInfo } from "./react-router-utils";
