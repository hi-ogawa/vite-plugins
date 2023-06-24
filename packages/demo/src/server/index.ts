import { compose } from "@hattip/compose";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/hattip";
import { indexHtmlMiddleware } from "@hiogawa/vite-index-html-middleware/runtime";

export function createHattipApp() {
  return compose(globApiRoutes(), indexHtmlMiddleware());
}
