import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: [
      "src/vite/index.ts",
      "src/vite/entry-browser.tsx",
      "src/vite/entry-ssr.tsx",
      "src/vite/entry-server.tsx",
      "src/compat/index.tsx",
      "src/compat/link.tsx",
      "src/compat/navigation.tsx",
      "src/compat/navigation.react-server.tsx",
      "src/compat/headers.tsx",
      "src/compat/image.tsx",
      "src/compat/font/local.tsx",
      "src/compat/font/google.tsx",
    ],
    format: ["esm"],
    dts: true,
    external: [],
  },
]);
