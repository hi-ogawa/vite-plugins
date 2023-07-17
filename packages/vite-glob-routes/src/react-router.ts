import internalEager from "virtual:@hiogawa/vite-glob-routes/internal/page-routes";
import internalLazy from "virtual:@hiogawa/vite-glob-routes/internal/page-routes/lazy";
import { createGlobPageRoutes } from "./react-router-utils";

// TODO: proper peer-dependency version range

//
// provide "react-router" RouterObject tree (only type dependency)
//

// TODO: create separate exports for
// globPageRoutesClient
// globPageRoutesClientLazy
// globPageRoutesServer

export function globPageRoutes() {
  return createGlobPageRoutes(internalEager);
}

export function globPageRoutesLazy() {
  return createGlobPageRoutes(internalLazy);
}

export { type GlobPageRoutesResult, walkArrayTree } from "./react-router-utils";

//
// provide helpers for standard SSR setup (depends on "react-router-dom")
//

export {
  handleReactRouterServer,
  type ServerRouterResult,
} from "./react-router-helper-server";

export { initializeClientRoutes } from "./react-router-helper-client";
