import fs from "node:fs";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/runtime.ts"],
  format: ["esm"],
  dts: {
    sourcemap: process.argv.slice(2).includes("--sourcemap"),
  },
  hooks: {
    "build:done"() {
      fs.appendFileSync(
        "./dist/index.d.ts",
        `\nimport type {} from "@hiogawa/vite-plugin-fullstack/types";\n`,
      );
    },
  },
}) as any;
