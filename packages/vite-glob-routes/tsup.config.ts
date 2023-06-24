import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/react-router.ts",
    "src/hattip.ts",
    "src/internal/index.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
});
