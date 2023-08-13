import virtualPageRoutesClient from "virtual:@hiogawa/vite-glob-routes/internal/pageRoutesClient";
import { createGlobPageRoutes } from "./route-utils";

export function globPageRoutesClientEager() {
  return createGlobPageRoutes(virtualPageRoutesClient);
}
