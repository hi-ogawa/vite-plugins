import {
  type ImportAssetsResult,
  mergeAssets,
} from "@hiogawa/vite-plugin-fullstack/runtime";
import { useHead } from "@unhead/vue";
import type { RouteRecordRaw } from "vue-router";

// custom framework may employ fs router convention and/or transform plugin
// to reduce boilerplace
export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("./routes/index.vue"),
    // TODO: use route meta
    beforeEnter: (_from, _to, next) => {
      useAssets(
        import.meta.vite.assets({
          import: "./routes/index.vue",
          environment: "client",
        }),
        import.meta.vite.assets({
          import: "./routes/index.vue",
          environment: "ssr",
        }),
      );
      next();
    },
  },
  {
    path: "/about",
    name: "client",
    component: () => import("./routes/about.vue"),
    beforeEnter: (_from, _to, next) => {
      useAssets(
        import.meta.vite.assets({
          import: "./routes/about.vue",
          environment: "client",
        }),
        import.meta.vite.assets({
          import: "./routes/about.vue",
          environment: "ssr",
        }),
      );
      next();
    },
  },
  {
    path: "/:catchAll(.*)",
    name: "not-found",
    component: () => import("./routes/not-found.vue"),
    beforeEnter: (_from, _to, next) => {
      useAssets(
        import.meta.vite.assets({
          import: "./routes/not-found.vue",
          environment: "client",
        }),
        import.meta.vite.assets({
          import: "./routes/not-found.vue",
          environment: "ssr",
        }),
      );
      next();
    },
  },
];

const rootAssets = [
  import.meta.vite.assets({
    import: "./root.vue",
    environment: "client",
  }),
  import.meta.vite.assets({
    import: "./root.vue",
    environment: "ssr",
  }),
  import.meta.vite.assets({
    import: "./framework/entry.client.tsx",
    environment: "client",
  }),
];

function useAssets(...args: ImportAssetsResult[]) {
  if (!import.meta.env.SSR) return;
  const assets = mergeAssets(...args, ...rootAssets);
  useHead({
    link: [
      ...assets.css.map((attrs) => ({ rel: "stylesheet", ...attrs })),
      ...assets.js.map((attrs) => ({ rel: "modulepreload", ...attrs })),
    ],
  });
}
