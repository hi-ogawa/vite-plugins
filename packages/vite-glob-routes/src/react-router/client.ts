import virtualPageRoutesClientLazy from "virtual:@hiogawa/vite-glob-routes/internal/pageRoutesClientLazy";
import { createGlobPageRoutes } from "./route-utils";

export function globPageRoutesClient() {
  return createGlobPageRoutes(virtualPageRoutesClientLazy);
}

export {
  initializeClientRoutes,
  getClientGlobal,
  getPagePrefetchLinks,
  resolveLazyRoutes,
  type ClientGlobal,
} from "./cilent-helper";

export * from "./features/data-request/client";
export * from "./features/preload/client";
