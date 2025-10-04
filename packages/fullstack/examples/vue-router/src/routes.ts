import type { RouteRecordRaw } from "vue-router";

// custom framework may employ fs router convention and/or transform plugin
// to reduce boilerplace
export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "app",
    component: () => import("./app.vue"),
    meta: {
      assets: [
        import.meta.vite.assets({
          import: "./app.vue",
        }),
        // include client entry for ssr modulepreload
        import.meta.vite.assets({
          import: "./framework/entry.client.ts",
          environment: "client",
        }),
      ],
    },
    children: [
      {
        path: "/",
        name: "home",
        component: () => import("./pages/index.vue"),
        meta: {
          assets: [
            import.meta.vite.assets({
              import: "./pages/index.vue",
            }),
          ],
        },
      },
      {
        path: "/about",
        name: "client",
        component: () => import("./pages/about.vue"),
        meta: {
          assets: [
            import.meta.vite.assets({
              import: "./pages/about.vue",
            }),
          ],
        },
      },
      {
        path: "/:catchAll(.*)",
        name: "not-found",
        component: () => import("./pages/not-found.vue"),
        meta: {
          assets: [
            import.meta.vite.assets({
              import: "./pages/not-found.vue",
            }),
          ],
        },
      },
    ],
  },
];
