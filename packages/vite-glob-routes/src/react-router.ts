import virtualPageRoutesClient from "virtual:@hiogawa/vite-glob-routes/internal/pageRoutesClient";
import vurtialPageRoutesClientLazy from "virtual:@hiogawa/vite-glob-routes/internal/pageRoutesClientLazy";
import virtualPageRoutesServer from "virtual:@hiogawa/vite-glob-routes/internal/pageRoutesServer";
import { createGlobPageRoutes } from "./react-router-utils";

// TODO: proper peer-dependency version range

// TODO: separate files for client and server? (currently all exported from "@hiogawa/vite-glob-routes/dist/react-router")

//
// provide "react-router" RouterObject tree (only type dependency)
//

export function globPageRoutesServer() {
  return createGlobPageRoutes(virtualPageRoutesServer);
}

export function globPageRoutesClient() {
  return createGlobPageRoutes(virtualPageRoutesClient);
}

export function globPageRoutesClientLazy() {
  return createGlobPageRoutes(vurtialPageRoutesClientLazy);
}

export { type GlobPageRoutesResult, walkArrayTree } from "./react-router-utils";

//
// provide helpers for standard SSR setup (depends on "react-router-dom")
//

export {
  handleReactRouterServer,
  type ServerRouterResult,
} from "./react-router-helper-server";

export {
  initializeClientRoutes,
  getClientGlobal,
  getPagePrefetchLinks,
  type ClientGlobal,
} from "./react-router-helper-client";

export {
  type ExtraRouterInfo,
  resolveAssetPathsByRouteId,
} from "./react-router-helper-shared";
