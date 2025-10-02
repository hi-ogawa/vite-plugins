import type { ImportAssetsResult } from "@hiogawa/vite-plugin-fullstack/types";
import type { RouteObject } from "react-router";

// custom framework may employ some convention and transform plugin
// to reduce boilerplace
export const routes: RouteObject[] = [
  {
    id: "root",
    path: "/",
    lazy: () => import("./root"),
    handle: {
      assets: mergeImportAssets(
        import.meta.vite.assets({
          import: "./root",
          environment: "client",
        }),
        import.meta.vite.assets({
          import: "./root",
          environment: "ssr",
        }),
        // include client entry for ssr modulepreload
        import.meta.vite.assets({
          import: "./entry.client.tsx",
          environment: "client",
        }),
      ),
    },
    children: [
      {
        id: "index",
        index: true,
        lazy: () => import("./routes/index"),
        handle: {
          // TODO: API to just merge them by default?
          assets: mergeImportAssets(
            import.meta.vite.assets({
              import: "./routes/index",
              environment: "client",
            }),
            import.meta.vite.assets({
              import: "./routes/index",
              environment: "ssr",
            }),
          ),
        },
      },
      {
        id: "about",
        path: "about",
        lazy: () => import("./routes/about"),
        handle: {
          assets: mergeImportAssets(
            import.meta.vite.assets({
              import: "./routes/about",
              environment: "client",
            }),
            import.meta.vite.assets({
              import: "./routes/about",
              environment: "ssr",
            }),
          ),
        },
      },
    ],
  },
];

export type CustomHandle = {
  assets: ImportAssetsResult;
};

function mergeImportAssets(...args: ImportAssetsResult[]): ImportAssetsResult {
  return {
    js: args.flatMap((a) => a.js),
    css: args.flatMap((a) => a.css),
  };
}
