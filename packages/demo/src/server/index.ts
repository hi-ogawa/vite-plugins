import { compose } from "@hattip/compose";
import THEME_SCRIPT from "@hiogawa/utils-experimental/dist/theme-script.global.js?raw";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import { indexHtmlMiddleware } from "@hiogawa/vite-index-html-middleware/dist/hattip";

export function createHattipApp() {
  return compose(globApiRoutes(), indexHtmlMiddleware({ injectToHead }));
}

function injectToHead() {
  return `
    <script>
      globalThis.__themeStorageKey = "vite-plugins:theme";
      globalThis.__themeDefault = "dark";
      ${THEME_SCRIPT}
    </script>
  `;
}
