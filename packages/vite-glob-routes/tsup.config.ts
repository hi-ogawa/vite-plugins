import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/react-router.ts", "src/hattip.ts"],
  format: ["esm", "cjs"],
  dts: true,
  external: [
    "virtual:@hiogawa/vite-glob-routes/internal/page-routes",
    "virtual:@hiogawa/vite-glob-routes/internal/api-routes",
  ],
});
