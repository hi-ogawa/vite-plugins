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

export {
  type GlobPageRoutesResult,
  walkArrayTree,
  walkArrayTreeAsync,
} from "./react-router-utils";

//
// provide helpers for standard SSR setup (depends on "react-router-dom")
//

export {
  handleReactRouterServer,
  resolveManifestAssets,
} from "./react-router-helper-server";

export {
  initializeClientRoutes,
  initializeReactRouterClient,
  proxyServerLoader,
} from "./react-router-helper-client";

export { type ExtraRouterInfo as RuntimeRouterInfo } from "./react-router-helper-shared";
