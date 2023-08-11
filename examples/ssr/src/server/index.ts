import { compose } from "@hattip/compose";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import { ssrHandler } from "./ssr";

export function createHattipApp() {
  return compose(globApiRoutes(), ssrHandler());
}
