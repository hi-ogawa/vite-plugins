import type { Plugin } from "vite";
import { name as packageName } from "../package.json";

const VIRTUAL_MODULE = `virtual:${packageName}`;

// keep multiple servers since plugin users can run multiple vite instances under single js process.
declare let globalThis: {
  __internal__importDevServer: Map<string, unknown>;
};
globalThis.__internal__importDevServer = new Map();

export default function importDevServerPlugin(): Plugin {
  let key: string | undefined;

  return {
    name: packageName,

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

    async resolveId(source, _importer, options) {
      if (options.ssr && source == VIRTUAL_MODULE) {
        return source;
      }
      return;
    },

    load(id, _options) {
      if (id === VIRTUAL_MODULE) {
        return key
          ? `export default globalThis.__internal__importDevServer.get("${key}");`
          : "export default undefined";
      }
      return;
    },
  };
}
