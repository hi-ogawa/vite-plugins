import vurtialPageRoutesClientLazy from "virtual:@hiogawa/vite-glob-routes/internal/pageRoutesClientLazy";
import { createGlobPageRoutes } from "./route-utils";

export function globPageRoutesClient() {
  return createGlobPageRoutes(vurtialPageRoutesClientLazy);
}

export {
  initializeClientRoutes,
  getClientGlobal,
  getPagePrefetchLinks,
  type ClientGlobal,
} from "./cilent-helper";
