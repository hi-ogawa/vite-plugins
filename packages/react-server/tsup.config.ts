import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: [
      "src/index.ts",
      "src/entry/rsc.tsx",
      "src/entry/ssr.tsx",
      "src/entry/client.tsx",
      "src/plugin/index.ts",
    ],
    format: ["esm"],
    dts: true,
    external: [
      /^virtual:/,
      // TODO: virtual module?
      "/dist/rsc/client-references.js",
      "/dist/rsc/index.js",
      "/dist/client/index.html?raw",
      "/index.html?raw",
    ],
  },
]);
