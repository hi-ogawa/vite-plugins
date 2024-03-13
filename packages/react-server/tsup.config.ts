import { defineConfig } from "tsup";

// TODO: organize export entries
// public/rsc,ssr,client,shared
// private/rsc,ssr,client,shared

export default defineConfig([
  {
    entry: [
      "src/index.ts",
      "src/client.tsx",
      "src/entry/rsc.tsx",
      "src/entry/ssr.tsx",
      "src/entry/client.tsx",
      "src/entry/shared.tsx",
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
