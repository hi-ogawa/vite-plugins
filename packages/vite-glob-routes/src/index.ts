import type { Plugin } from "vite";

const PAGE_ROUTES_REACT_ROUTER = "@hiogawa/vite-glob-routes/react-router";
const API_ROUTES_HATTIP = "@hiogawa/vite-glob-routes/hattip";
const TAG = "virtual:";

export function globRoutes(options: { root: string }): Plugin[] {
  // TODO: escape js string
  const root = options.root;
  return [
    {
      name: "@hiogawa/vite-glob-routes",
      enforce: "pre",

      async resolveId(source, _importer, _options) {
        if (
          source === PAGE_ROUTES_REACT_ROUTER ||
          source === API_ROUTES_HATTIP
        ) {
          return TAG + source;
        }
        return;
      },

      load(id, _options) {
        // NOTE
        // instead of completely relying on vite's glob import, we could also manually probe files and setup watcher etc...
        // cf. https://github.com/rakkasjs/rakkasjs/blob/18ba680d18f776acf2dedd44444873433552f4e3/packages/rakkasjs/src/features/api-routes/vite-plugin.ts#L8

        if (id === TAG + PAGE_ROUTES_REACT_ROUTER) {
          return `
            import { createGlobPageRoutes } from "@hiogawa/vite-glob-routes/internal";
            // TODO: non-eager import to code split?
            const globPage = import.meta.glob("${root}/**/*.page.(js|jsx|ts|tsx)", { eager: true });
            const globLayout = import.meta.glob("${root}/**/layout.(js|jsx|ts|tsx)", { eager: true });
            export const globPageRoutes = () => createGlobPageRoutes("${root}", globPage, globLayout);

          `;
        }

        if (id === TAG + API_ROUTES_HATTIP) {
          return `
            import { createGlobApiRoutes } from "@hiogawa/vite-glob-routes/internal";
            // TODO: import only "get/post/put/delete" to tree shake other exports?
            const globApi = import.meta.glob("${root}/**/*.api.(js|jsx|ts|tsx)", { eager: true });
            export const globApiRoutes = () => createGlobApiRoutes("${root}", globApi);
          `;
        }
        return;
      },
    },
  ];
}
