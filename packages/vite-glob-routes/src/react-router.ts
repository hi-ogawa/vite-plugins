import internal from "virtual:@hiogawa/vite-glob-routes/internal/page-routes";
import { createGlobPageRoutes } from "./react-router-utils";
export type { RouteObjectWithGlobInfo } from "./react-router-utils";

// TODO: proepr peer-dependency version range

// provide "react-router" RouterObject (only type dependency)
export function globPageRoutes() {
  return createGlobPageRoutes(internal);
}

// provide helpers for standard SSR setup (depends on "react-router-dom")
export {
  handleReactRouterServer,
  getCurrentRouteAssets,
} from "./react-router-helper-server";
export { initializeReactRouterClient } from "./react-router-helper-client";
