import virtualPageRoutesServer from "virtual:@hiogawa/vite-glob-routes/internal/pageRoutesServer";
import { createGlobPageRoutes } from "./route-utils";

export function globPageRoutesServer() {
  return createGlobPageRoutes(virtualPageRoutesServer);
}

export {
  handleReactRouterServer,
  type ServerRouterResult,
} from "./server-helper";
