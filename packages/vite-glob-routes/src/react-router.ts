import type { createGlobPageRoutes } from "./internal/react-router";

export const globPageRoutes = (() => {
  throw new Error(
    "@hiogawa/vite-glob-routes plugin might not be configured properly"
  );
}) as () => ReturnType<typeof createGlobPageRoutes>;
