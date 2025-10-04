import type { RouteRecordRaw } from "vue-router";

// custom framework may employ fs router convention to reduce boilerplace.
export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "app",
    component: () => import("./app.vue"),
    meta: {
      assets: import.meta.vite.assets({ import: "./app.vue" }),
    },
    children: [
      {
        path: "/",
        name: "home",
        component: () => import("./pages/index.vue"),
        meta: {
          assets: import.meta.vite.assets({ import: "./pages/index.vue" }),
        },
      },
      {
        path: "/about",
        name: "about",
        component: () => import("./pages/about.vue"),
        meta: {
          assets: import.meta.vite.assets({ import: "./pages/about.vue" }),
        },
      },
      {
        path: "/:catchAll(.*)",
        name: "not-found",
        component: () => import("./pages/not-found.vue"),
        meta: {
          assets: import.meta.vite.assets({ import: "./pages/not-found.vue" }),
        },
      },
    ],
  },
];
