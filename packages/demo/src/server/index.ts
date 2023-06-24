import indexHtmlMiddleware from "virtual:@hiogawa/vite-index-html-middleware/hattip";
import globApiRoutes from "virtual:glob-api-routes/hattip";
import { compose } from "@hattip/compose";

export function createHattipApp() {
  return compose(globApiRoutes(), indexHtmlMiddleware());
}
