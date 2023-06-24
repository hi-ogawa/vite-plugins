import globApiRoutes from "virtual:glob-api-routes/hattip";
import indexHtmlMiddleware from "virtual:index-html-middleware/hattip";
import { compose } from "@hattip/compose";

export function createHattipApp() {
  return compose(globApiRoutes(), indexHtmlMiddleware());
}
