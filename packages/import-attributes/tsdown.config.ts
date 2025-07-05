import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/plugin.ts",
    "src/entry.browser.tsx",
    "src/entry.rsc.tsx",
    "src/entry.rsc.single.tsx",
    "src/entry.ssr.tsx",
    "src/client.tsx",
  ],
  format: ["esm"],
  external: [/^virtual:/],
  dts: {
    sourcemap: process.argv.slice(2).includes("--sourcemap"),
  },
}) as any;
