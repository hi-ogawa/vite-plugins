import { defineConfig } from "tsup";

export default [
  defineConfig({
    entry: ["src/worker.ts"],
    format: ["esm"],
    platform: "browser",
    external: ["cloudflare:workers"],
  }),
  defineConfig({
    entry: ["src/index.ts"],
    format: ["esm"],
    platform: "node",
    dts: true,
  }),
];
