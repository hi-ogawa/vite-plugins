import virtualPageRoutesClient from "virtual:@hiogawa/vite-glob-routes/internal/pageRoutesClient";
import vurtialPageRoutesClientLazy from "virtual:@hiogawa/vite-glob-routes/internal/pageRoutesClientLazy";
import { createGlobPageRoutes } from "./route-utils";

export function globPageRoutesClient() {
  return createGlobPageRoutes(virtualPageRoutesClient);
}

export function globPageRoutesClientLazy() {
  return createGlobPageRoutes(vurtialPageRoutesClientLazy);
}

export {
  initializeClientRoutes,
  getClientGlobal,
  getPagePrefetchLinks,
  type ClientGlobal,
} from "./cilent-helper";

export * from "./features/preload/client";
