import internal from "virtual:@hiogawa/vite-index-html-middleware/internal/page-routes";
import { createGlobPageRoutes } from "./react-router-utils";

export function globPageRoutes() {
  const { root, globPage, globLayout } = internal;
  return createGlobPageRoutes(root, globPage, globLayout);
}
