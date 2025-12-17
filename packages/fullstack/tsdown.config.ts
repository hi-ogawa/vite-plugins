import fs from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/runtime.ts"],
  format: ["esm"],
  dts: {
    sourcemap: process.argv.slice(2).includes("--sourcemap"),
  },
  hooks: {
    async "build:done"() {
      fs.appendFileSync(
        "./dist/index.d.ts",
        `\nimport type {} from "@hiogawa/vite-plugin-fullstack/types";\n`,
      );
      // inline file content as raw string to allow downstream package `nitro` to bundle this plugin package
      let pluginBundle = await readFile("dist/index.js", "utf-8");
      await writeFile(
        "dist/index.js",
        pluginBundle.replace(
          `fs.readFileSync(path.join(import.meta.dirname, "runtime.js"), "utf-8")`,
          `\`${await readFile("dist/runtime.js", "utf-8")}\``,
        ),
      );
    },
  },
}) as any;
