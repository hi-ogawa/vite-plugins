import type { ImportAssetsResult } from "@hiogawa/vite-plugin-fullstack/types";
import type { RouteObject } from "react-router";

// custom framework may employ convention and transform plugin to reduce boilerplace
export const routes: RouteObject[] = [
  {
    id: "root",
    path: "/",
    lazy: () => import("./root"),
    handle: {
      assets: {
        client: mergeImportAssetsResult(
          import.meta.vite.assets({
            import: "./entry.client",
            environment: "client",
          }),
          import.meta.vite.assets({
            import: "./root",
            environment: "client",
          }),
        ),
        server: import.meta.vite.assets({
          import: "./root",
          environment: "ssr",
        }),
      },
    },
    children: [
      {
        id: "index",
        index: true,
        lazy: () => import("./routes/index"),
        handle: {
          assets: {
            client: import.meta.vite.assets({
              import: "./routes/index",
              environment: "client",
            }),
            server: import.meta.vite.assets({
              import: "./routes/index",
              environment: "ssr",
            }),
          },
        },
      },
      {
        id: "about",
        path: "about",
        lazy: () => import("./routes/about"),
        handle: {
          assets: {
            client: import.meta.vite.assets({
              import: "./routes/about",
              environment: "client",
            }),
            server: import.meta.vite.assets({
              import: "./routes/about",
              environment: "ssr",
            }),
          },
        },
      },
    ],
  },
];

export type AssetsHandle = {
  assets: {
    client: ImportAssetsResult;
    server: ImportAssetsResult;
  };
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
