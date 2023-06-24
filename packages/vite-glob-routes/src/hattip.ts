import type { createGlobApiRoutes } from "./hattip-internal";

export const globApiRoutes = (() => {
  throw new Error(
    "@hiogawa/vite-glob-routes plugin might not be configured properly"
  );
}) as () => ReturnType<typeof createGlobApiRoutes>;
