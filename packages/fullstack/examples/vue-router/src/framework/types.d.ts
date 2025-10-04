// https://router.vuejs.org/guide/advanced/meta.html#TypeScript
import "vue-router";

export {};

declare module "vue-router" {
  interface RouteMeta {
    assets?: import("@hiogawa/vite-plugin-fullstack/runtime").ImportAssetsResult[];
  }
}
