import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: [
      "src/index.ts",
      "src/server.ts",
      "src/client.tsx",
      "src/runtime-client.ts",
      "src/runtime-browser.ts",
      "src/runtime-server.ts",
      "src/runtime-react-server.ts",
      "src/entry/react-server.tsx",
      "src/entry/server.tsx",
      "src/entry/browser.tsx",
      "src/plugin/index.ts",

      // next compat
      "src/next/plugin.ts",
      "src/next/entry-browser.ts",
      "src/next/entry-ssr.ts",
      "src/next/compat/index.tsx",
      "src/next/compat/image.tsx",
      "src/next/compat/font/local.tsx",
      "src/next/compat/font/google.tsx",
    ],
    format: ["esm"],
    dts: !process.env["NO_DTS"],
    external: [/^virtual:/, /^@hiogawa\/react-server\//, /^\/dist\//],
  },
]);
