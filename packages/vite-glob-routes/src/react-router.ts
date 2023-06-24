import type { createGlobPageRoutes } from "./react-router-internal";

export const globPageRoutes = (() => {
  throw new Error(
    "@hiogawa/vite-glob-routes plugin might not be configured properly"
  );
}) as () => ReturnType<typeof createGlobPageRoutes>;
