import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
  },
  {
    entry: [
      "src/react-router/client.ts",
      "src/react-router/server.ts",
      "src/hattip.ts",
    ],
    format: ["esm"],
    dts: true,
    external: [/^virtual:@hiogawa\/vite-glob-routes/],
  },
]);
