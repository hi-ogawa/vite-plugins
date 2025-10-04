import "vue-router";

export {};

declare module "vue-router" {
  interface RouteMeta {
    assets?: import("@hiogawa/vite-plugin-fullstack/runtime").ImportAssetsResult[];
  }
}
