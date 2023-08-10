import type { Plugin } from "vite";
import { name as packageName } from "../package.json";

// pass internal runtime data via virtual module
const VIRTUAL_INTERNAL = `virtual:${packageName}/internal`;

// expose ViteDevServer to access "transformIndexHtml" during `vite dev`
// https://github.com/cyco130/vavite/blob/913e066fd557a1720923361db77c195ac237ac26/packages/expose-vite-dev-server/src/index.ts
// https://github.com/brillout/vite-plugin-ssr/blob/906bd4d0cba2c4eff519ef5622f0dc10128b484a/vite-plugin-ssr/node/runtime/html/injectAssets/getViteDevScripts.ts#L16
const GLOABL_KEY = `__${importDevServerPlugin.name}_viteDevServer`;

export default function importDevServerPlugin(): Plugin {
  return {
    name: packageName,

    configureServer: (server) => {
      (globalThis as any)[GLOABL_KEY] = server;
    },

    buildEnd() {
      delete (globalThis as any)[GLOABL_KEY];
    },

    config(_config, _env) {
      // vite has to handle internal "virtual" modules
      // cf. https://github.com/cyco130/vavite/blob/913e066fd557a1720923361db77c195ac237ac26/packages/expose-vite-dev-server/src/index.ts#L49-L65
      const exclude = [packageName];
      return {
        optimizeDeps: {
          exclude,
        },
        ssr: {
          noExternal: exclude,
          optimizeDeps: {
            exclude,
          },
        },
      };
    },

    async resolveId(source, _importer, options) {
      if (options.ssr && source == VIRTUAL_INTERNAL) {
        return source;
      }
      return;
    },

    load(id, _options) {
      if (id === VIRTUAL_INTERNAL) {
        return `
          export default {
            server: globalThis[${JSON.stringify(GLOABL_KEY)}],
            importIndexHtmlRaw: () => (import.meta.env.DEV ? import("/index.html?raw") : import("/dist/client/index.html?raw")),
          }
        `;
      }
      return;
    },
  };
}
