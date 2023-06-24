import { compose } from "@hattip/compose";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import { indexHtmlMiddleware } from "@hiogawa/vite-index-html-middleware/dist/hattip";

export function createHattipApp() {
  return compose(globApiRoutes(), indexHtmlMiddleware());
}
