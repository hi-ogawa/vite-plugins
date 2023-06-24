import internal from "virtual:@hiogawa/vite-glob-routes/internal/page-routes";
import { createGlobPageRoutes } from "./react-router-utils";

export function globPageRoutes() {
  const { root, globPage, globLayout } = internal;
  return createGlobPageRoutes(root, globPage, globLayout);
}
