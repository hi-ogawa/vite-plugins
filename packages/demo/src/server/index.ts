import globApiRoutes from "virtual:glob-api-routes/hattip";
import { compose } from "@hattip/compose";
import { indexHtmlMiddleware } from "@hiogawa/vite-index-html-middleware/runtime";

export function createHattipApp() {
  return compose(globApiRoutes(), indexHtmlMiddleware());
}
