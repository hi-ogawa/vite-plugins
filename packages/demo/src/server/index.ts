import { type RequestHandler, compose } from "@hattip/compose";
import THEME_SCRIPT from "@hiogawa/utils-experimental/dist/theme-script.global.js?raw";
import { globApiRoutes } from "@hiogawa/vite-glob-routes/dist/hattip";
import { indexHtmlMiddleware } from "@hiogawa/vite-index-html-middleware/dist/hattip";
import type { Context, MiddlewareHandler } from "hono";
import { logger } from "hono/logger";

// this also reproduces.
// somehow commenting out either one will fix it.
const howAbouThis1 = import.meta.glob("../routes/**/*.page.tsx", {
  eager: true,
});
const howAbouThis2 = import.meta.glob("../routes/**/layout.tsx", {
  eager: true,
});

export function createHattipApp() {
  return compose(
    hattipHonoCompat(logger()),
    globApiRoutes(),
    indexHtmlMiddleware({ injectToHead })
  );
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

// minimal compatibility to use hono's logger in hattip
// https://github.com/honojs/hono/blob/0ffd795ec6cfb67d38ab902197bb5461a4740b8f/src/middleware/logger/index.ts
function hattipHonoCompat(hono: MiddlewareHandler): RequestHandler {
  return async (ctx) => {
    let res!: Response;
    await hono(
      {
        req: { method: ctx.method, raw: ctx.request },
        get res() {
          return res;
        },
      } as Context,
      async () => {
        res = await ctx.next();
      }
    );
    return res;
  };
}
