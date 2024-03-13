import { defineConfig } from "tsup";

// TODO: organize export entries
// public/rsc,ssr,client,shared
// private/rsc,ssr,client,shared

export default defineConfig([
  {
    entry: [
      "src/index.ts",
      "src/server.ts",
      "src/server-internal.ts",
      "src/client.tsx",
      "src/client-internal.ts",
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
