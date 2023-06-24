import type { Plugin } from "vite";

// pass internal runtime data via virtual module
const VIRTUAL_INTERNAL_PAGE_ROUTES =
  "virtual:@hiogawa/vite-glob-routes/internal/page-routes";
const VIRTUAL_INTERNAL_API_ROUTES =
  "virtual:@hiogawa/vite-glob-routes/internal/api-routes";

export default function globRoutesPlugin(options: { root: string }): Plugin[] {
  // TODO: escape js string
  const root = options.root;
  return [
    {
      name: "@hiogawa/vite-glob-routes",

      config(_config, _env) {
        // vite has to handle internal "virtual" modules
        // cf. https://github.com/cyco130/vavite/blob/913e066fd557a1720923361db77c195ac237ac26/packages/expose-vite-dev-server/src/index.ts#L49-L65
        const exclude = ["@hiogawa/vite-glob-routes"];
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
        if (
          source === VIRTUAL_INTERNAL_PAGE_ROUTES ||
          source === VIRTUAL_INTERNAL_API_ROUTES
        ) {
          return source;
        }
        return;
      },

      load(id, _options) {
        // NOTE
        // instead of completely relying on vite's glob import, we could also manually probe files and setup watcher etc...
        // cf. https://github.com/rakkasjs/rakkasjs/blob/18ba680d18f776acf2dedd44444873433552f4e3/packages/rakkasjs/src/features/api-routes/vite-plugin.ts#L8

        if (id === VIRTUAL_INTERNAL_PAGE_ROUTES) {
          // TODO: non-eager import to code split with lazy route?
          return `
            const root = "${root}";
            const globPage = import.meta.glob("${root}/**/*.page.(js|jsx|ts|tsx)", { eager: true });
            const globLayout = import.meta.glob("${root}/**/layout.(js|jsx|ts|tsx)", { eager: true });
            export default { root, globPage, globLayout };
          `;
        }

        if (id === VIRTUAL_INTERNAL_API_ROUTES) {
          // TODO: import only "get/post/put/delete" to tree shake other exports?
          return `
            const root = "${root}";
            const globApi = import.meta.glob("${root}/**/*.api.(js|jsx|ts|tsx)", { eager: true });
            export default { root, globApi };
          `;
        }
        return;
      },
    },
  ];
}
