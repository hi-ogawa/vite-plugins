import type { RouteObject } from "react-router";

export const routes: RouteObject[] = [
  {
    id: "root",
    path: "/",
    lazy: () => import("./root"),
    children: [
      {
        id: "index",
        index: true,
        lazy: () => import("./routes/index"),
      },
      {
        id: "about",
        path: "about",
        lazy: () => import("./routes/about"),
      },
    ],
  },
];
