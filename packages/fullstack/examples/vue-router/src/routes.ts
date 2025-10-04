import type { RouteRecordRaw } from "vue-router";

// custom framework may employ fs router convention and/or transform plugin
// to reduce boilerplace
export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "root",
    component: () => import("./root.vue"),
    meta: {
      assets: [
        import.meta.vite.assets({
          import: "./root.vue",
        }),
        // include client entry for ssr modulepreload
        import.meta.vite.assets({
          import: "./framework/entry.client.tsx",
          environment: "client",
        }),
      ],
    },
    children: [
      {
        path: "/",
        name: "home",
        component: () => import("./routes/index.vue"),
        meta: {
          assets: [
            import.meta.vite.assets({
              import: "./routes/index.vue",
            }),
          ],
        },
      },
      {
        path: "/about",
        name: "client",
        component: () => import("./routes/about.vue"),
        meta: {
          assets: [
            import.meta.vite.assets({
              import: "./routes/about.vue",
            }),
          ],
        },
      },
      {
        path: "/:catchAll(.*)",
        name: "not-found",
        component: () => import("./routes/not-found.vue"),
        meta: {
          assets: [
            import.meta.vite.assets({
              import: "./routes/not-found.vue",
            }),
          ],
        },
      },
    ],
  },
];
