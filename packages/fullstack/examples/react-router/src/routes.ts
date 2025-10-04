import type { RouteObject } from "react-router";

// custom framework may employ fs router convention to reduce boilerplace
export const routes: RouteObject[] = [
  {
    id: "root",
    path: "/",
    lazy: () => import("./root"),
    handle: {
      assets: () => import("./root?assets"),
    },
    children: [
      {
        id: "index",
        index: true,
        lazy: () => import("./routes/index"),
        handle: {
          assets: () => import("./routes/index?assets"),
        },
      },
      {
        id: "about",
        path: "about",
        lazy: () => import("./routes/about"),
        handle: {
          assets: () => import("./routes/about?assets"),
        },
      },
    ],
  },
];
