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
      assets: mergeImportAssetsResult(
        import.meta.vite.assets({
          import: "./root",
          universal: true,
        }),
        // always include client entry for ssr modulepreload
        import.meta.vite.assets({
          import: "./entry.client",
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
          assets: import.meta.vite.assets({
            import: "./routes/index",
            universal: true,
          }),
        },
      },
      {
        id: "about",
        path: "about",
        lazy: () => import("./routes/about"),
        handle: {
          assets: import.meta.vite.assets({
            import: "./routes/about",
            universal: true,
          }),
        },
      },
    ],
  },
];

export type Handle = {
  assets: ImportAssetsResult;
};

function mergeImportAssetsResult(
  a: ImportAssetsResult,
  b: ImportAssetsResult,
): ImportAssetsResult {
  return {
    js: [...a.js, ...b.js],
    css: [...a.css, ...b.css],
  };
}
