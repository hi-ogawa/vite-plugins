import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/hooks/data.ts", "src/hooks/wasm.ts"],
  format: ["esm"],
  dts: true,
});
