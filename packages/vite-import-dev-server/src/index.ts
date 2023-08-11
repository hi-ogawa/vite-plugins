import type { Plugin, ViteDevServer } from "vite";
import { name as packageName } from "../package.json";

const MODULE_NAME = `${packageName}/runtime`;

// keep multiple servers since plugin users could technically run multiple vite instances under single js process
declare let globalThis: {
  __internal__importDevServer: Map<string, ViteDevServer>;
};
globalThis.__internal__importDevServer ??= new Map();

export default function importDevServerPlugin(): Plugin {
  let key: string | undefined;

  return {
    name: packageName,

    enforce: "pre",

    configureServer: (server) => {
      key = Math.floor(Math.random() * 2 ** 32).toString(16);
      globalThis.__internal__importDevServer.set(key, server);
    },

    buildEnd() {
      if (key) {
        globalThis.__internal__importDevServer.delete(key);
        key = undefined;
      }
    },

    config(_config, _env) {
      // exclude "virtual" modules from esbuild optimization
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

    // same idea as vavite but no idea why vavite is not working
    // https://github.com/cyco130/vavite/blob/3cf52a5bd25deadde0949a52be31af1ad04c36d8/packages/expose-vite-dev-server/src/index.ts#L28
    async resolveId(source, _importer, options) {
      if (options.ssr && source === MODULE_NAME) {
        return { id: MODULE_NAME };
      }
      return;
    },

    load(id, _options) {
      if (id === MODULE_NAME) {
        return key
          ? `export const viteDevServer = globalThis.__internal__importDevServer.get("${key}");`
          : "export const viteDevServer = undefined";
      }
      return;
    },
  };
}
