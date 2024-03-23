import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: [
      "src/index.ts",
      "src/server.ts",
      "src/server-internal.ts",
      "src/client.tsx",
      "src/client-internal.ts",
      "src/entry/react-server.tsx",
      "src/entry/server.tsx",
      "src/entry/browser.tsx",
      "src/plugin/index.ts",
    ],
    format: ["esm"],
    dts: !process.env["NO_DTS"],
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
