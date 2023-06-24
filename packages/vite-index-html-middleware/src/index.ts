import type { Plugin } from "vite";

const EXPORT_HATTIP = "@hiogawa/vite-index-html-middleware/dist/hattip";
const TAG = "virtual:";

const globalViteDevServerKey =
  "__indexHtmlMiddlewarePlugin_globalViteDevServerKey";

export default function indexHtmlMiddlewarePlugin(): Plugin {
  return {
    name: "@hiogawa/vite-index-html-middleware",
    enforce: "pre", // required to intercept `resolveId`

    // expose dev server to access "transformIndexHtml"
    // https://github.com/cyco130/vavite/blob/913e066fd557a1720923361db77c195ac237ac26/packages/expose-vite-dev-server/src/index.ts
    // https://github.com/brillout/vite-plugin-ssr/blob/906bd4d0cba2c4eff519ef5622f0dc10128b484a/vite-plugin-ssr/node/runtime/html/injectAssets/getViteDevScripts.ts#L16
    configureServer: (server) => {
      (globalThis as any)[globalViteDevServerKey] = server;
    },

    buildEnd() {
      delete (globalThis as any)[globalViteDevServerKey];
    },

    async resolveId(source, _importer, options) {
      if (options.ssr && source === EXPORT_HATTIP) {
        return TAG + EXPORT_HATTIP;
      }
      return;
    },

    load(id, _options) {
      // TODO: configurable index.html entry?
      if (id === TAG + EXPORT_HATTIP) {
        return `
          import { createIndexHtmlMiddleware } from "@hiogawa/vite-index-html-middleware/dist/internal";
          export const indexHtmlMiddleware = createIndexHtmlMiddleware({
            server: globalThis[${JSON.stringify(globalViteDevServerKey)}],
            importIndexHtml: () => (import.meta.env.DEV ? import("/index.html?raw") : import("/dist/client/index.html?raw")),
          });
        `;
      }
      return;
    },
  };
}
