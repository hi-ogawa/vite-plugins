import type { ImportAssetsResult } from "@hiogawa/vite-plugin-fullstack/runtime";
import type { RouteObject } from "react-router";

// custom framework may employ fs router convention to reduce boilerplace
export const routes: RouteObject[] = [
  {
    id: "root",
    path: "/",
    lazy: () => import("./root"),
    handle: {
      assets: import.meta.vite.assets({
        import: "./root",
      }),
    } satisfies CustomHandle,
    children: [
      {
        id: "index",
        index: true,
        lazy: () => import("./routes/index"),
        handle: {
          assets: import.meta.vite.assets({
            import: "./routes/index",
          }),
        } satisfies CustomHandle,
      },
      {
        id: "about",
        path: "about",
        lazy: () => import("./routes/about"),
        handle: {
          assets: import.meta.vite.assets({
            import: "./routes/about",
          }),
        } satisfies CustomHandle,
      },
    ],
  },
];

export type CustomHandle = {
  assets: ImportAssetsResult;
};
