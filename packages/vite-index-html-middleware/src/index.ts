import type { Plugin } from "vite";

// TODO: how to expose as non virtual? (so that it's easy to provide import typing?)
const virtualId = "virtual:@hiogawa/vite-index-html-middleware/hattip";
const globalViteDevServerKey =
  "__indexHtmlMiddlewarePlugin_globalViteDevServerKey";

export function indexHtmlMiddlewarePlugin(): Plugin {
  return {
    name: "@hiogawa/vite-index-html-middleware",

    // expose dev server to access "transformIndexHtml"
    // https://github.com/cyco130/vavite/blob/913e066fd557a1720923361db77c195ac237ac26/packages/expose-vite-dev-server/src/index.ts
    // https://github.com/brillout/vite-plugin-ssr/blob/906bd4d0cba2c4eff519ef5622f0dc10128b484a/vite-plugin-ssr/node/runtime/html/injectAssets/getViteDevScripts.ts#L16
    configureServer: (server) => {
      (globalThis as any)[globalViteDevServerKey] = server;
    },

    closeWatcher() {
      delete (globalThis as any)[globalViteDevServerKey];
    },

    async resolveId(source, _importer, _options) {
      if (source === virtualId) {
        return source;
      }
      return;
    },

    load(id, _options) {
      // TODO: configurable index.html entry?
      if (id === virtualId) {
        return `
          import { createIndexHtmlMiddleware } from "@hiogawa/vite-index-html-middleware/runtime";
          export default createIndexHtmlMiddleware({
            server: globalThis[${JSON.stringify(globalViteDevServerKey)}],
            importIndexHtml: () => (import.meta.env.DEV ? import("/index.html?raw") : import("/dist/client/index.html?raw")),
          });
        `;
      }
      return;
    },
  };
}
