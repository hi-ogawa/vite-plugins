import type { Plugin } from "vite";
import { name as packageName } from "../package.json";

// pass internal runtime data via virtual module
// biome-ignore format:
const VIRTUAL = {
  apiRoutes:            `virtual:${packageName}/internal/apiRoutes`,
  pageRoutesServer:     `virtual:${packageName}/internal/pageRoutesServer`,
  pageRoutesClient:     `virtual:${packageName}/internal/pageRoutesClient`,
  pageRoutesClientLazy: `virtual:${packageName}/internal/pageRoutesClientLazy`,
};
const VIRTUALS = Object.values(VIRTUAL);

export default function globRoutesPlugin(options: { root: string }): Plugin {
  // TODO: escape js string
  const root = options.root;

  return {
    name: packageName,

    config(_config, _env) {
      // vite has to handle internal "virtual" modules
      // note that this is not necessary when using this plugin within monorepo (i.e. packages/demo) since vite automatically configures in this way.
      // however the plugin would break without this option when it is used as external dependency.
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

    async resolveId(source, _importer, _options) {
      if (VIRTUALS.includes(source)) {
        return wrapVmod(source);
      }
      return;
    },

    load(id, options) {
      // NOTE
      // instead of completely relying on vite's glob import, we could also manually probe files and setup watcher etc...
      // cf. https://github.com/rakkasjs/rakkasjs/blob/18ba680d18f776acf2dedd44444873433552f4e3/packages/rakkasjs/src/features/api-routes/vite-plugin.ts#L8

      if (id === wrapVmod(VIRTUAL.pageRoutesServer)) {
        // TODO: validate with `options.ssr` or silently let module become empty for unintended server import on client build?
        options?.ssr;

        return generatePageRoutesCode({ root, eager: true, server: true });
      }

      if (id === wrapVmod(VIRTUAL.pageRoutesClient)) {
        return generatePageRoutesCode({ root, eager: true, server: false });
      }

      if (id === wrapVmod(VIRTUAL.pageRoutesClientLazy)) {
        return generatePageRoutesCode({
          root,
          eager: false,
          server: false,
        });
      }

      if (id === wrapVmod(VIRTUAL.apiRoutes)) {
        // TODO: import only "get/post/put/delete" to tree shake other exports?
        return `
          const root = "${root}";
          const globApi = import.meta.glob("${root}/**/*.api.(js|jsx|ts|tsx)", { eager: true });
          export default { root, globApi };
        `;
      }
      return;
    },
  };
}

function generatePageRoutesCode({
  root,
  eager,
  server,
}: {
  root: string;
  eager: boolean;
  server: boolean;
}) {
  const serverCode = server
    ? `
    globPageServer:   import.meta.glob("${root}/**/*.page.server.(js|jsx|ts|tsx)", { eager: ${eager} }),
    globLayoutServer: import.meta.glob("${root}/**/layout.server.(js|jsx|ts|tsx)", { eager: ${eager} }),
  `
    : `
    globPageServer:   {},
    globLayoutServer: {},
  `;
  return `
    export default {
      eager: ${eager},
      root: "${root}",
      globPage:         import.meta.glob("${root}/**/*.page.(js|jsx|ts|tsx)", { eager: ${eager} }),
      globLayout:       import.meta.glob("${root}/**/layout.(js|jsx|ts|tsx)", { eager: ${eager} }),
      ${serverCode}
    };
  `;
}

// https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention
const wrapVmod = (id: string) => "\0" + id;
