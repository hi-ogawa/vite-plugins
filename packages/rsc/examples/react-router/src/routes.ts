import type { ServerRouteObject } from "react-router/rsc";

export const routes: ServerRouteObject[] = [
  {
    id: "root",
    lazy: () => import("./routes/root"),
    children: [
      {
        id: "home",
        index: true,
        lazy: () => import("./routes/home"),
      },
      {
        id: "about",
        path: "about",
        lazy: () => import("./routes/about"),
      },
    ],
  },
];
