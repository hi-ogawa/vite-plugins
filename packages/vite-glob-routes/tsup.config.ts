import { defineConfig } from "tsup";

export default defineConfig({
  // TODO: clean only on release build
  // clean: true,
  entry: ["src/index.ts", "src/react-router.ts", "src/hattip.ts"],
  format: ["esm", "cjs"],
  dts: true,
  external: [
    "virtual:@hiogawa/vite-glob-routes/internal/pageRoutesServer",
    "virtual:@hiogawa/vite-glob-routes/internal/pageRoutesClient",
    "virtual:@hiogawa/vite-glob-routes/internal/pageRoutesClientLazy",
    "virtual:@hiogawa/vite-glob-routes/internal/apiRoutes",
  ],
});
