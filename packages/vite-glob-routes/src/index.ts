import type { Plugin } from "vite";

// const PAGE_ROUTES_REACT_ROUTER = "@hiogawa/vite-glob-routes/dist/react-router";
// const API_ROUTES_HATTIP = "@hiogawa/vite-glob-routes/dist/hattip";
// const TAG = "virtual:";

// pass internal runtime data via virtual module
const VIRTUAL_INTERNAL_PAGE_ROUTES =
  "virtual:@hiogawa/vite-index-html-middleware/internal/page-routes";
const VIRTUAL_INTERNAL_API_ROUTES =
  "virtual:@hiogawa/vite-index-html-middleware/internal/api-routes";

export default function globRoutesPlugin(options: { root: string }): Plugin[] {
  // TODO: escape js string
  const root = options.root;
  return [
    {
      name: "@hiogawa/vite-glob-routes",
      // // https://github.com/vitejs/vite/issues/9364#issuecomment-1197842127
      // enforce: "pre", // TODO: this works in the demo (inside monorepo), but doesn't when installed externally in https://github.com/hi-ogawa/youtube-dl-web-v2/pull/62 ???

      async resolveId(source, _importer, _options) {
        if (
          source === VIRTUAL_INTERNAL_PAGE_ROUTES ||
          source === VIRTUAL_INTERNAL_API_ROUTES
        ) {
          return source;
        }
        // if (
        //   source === PAGE_ROUTES_REACT_ROUTER ||
        //   source === API_ROUTES_HATTIP
        // ) {
        //   return TAG + source;
        // }
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

        // if (id === TAG + PAGE_ROUTES_REACT_ROUTER) {
        //   return `
        //     import { createGlobPageRoutes } from "@hiogawa/vite-glob-routes/dist/internal";
        //     // TODO: non-eager import to code split?
        //     const globPage = import.meta.glob("${root}/**/*.page.(js|jsx|ts|tsx)", { eager: true });
        //     const globLayout = import.meta.glob("${root}/**/layout.(js|jsx|ts|tsx)", { eager: true });
        //     export const globPageRoutes = () => createGlobPageRoutes("${root}", globPage, globLayout);
        //   `;
        // }

        // if (id === TAG + API_ROUTES_HATTIP) {
        //   return `
        //     import { createGlobApiRoutes } from "@hiogawa/vite-glob-routes/dist/internal";
        //     // TODO: import only "get/post/put/delete" to tree shake other exports?
        //     const globApi = import.meta.glob("${root}/**/*.api.(js|jsx|ts|tsx)", { eager: true });
        //     export const globApiRoutes = () => createGlobApiRoutes("${root}", globApi);
        //   `;
        // }
        // return;
      },
    },
  ];
}
