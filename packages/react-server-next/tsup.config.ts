import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: [
      "src/plugin/index.ts",
      "src/plugin/entry-browser.tsx",
      "src/plugin/entry-ssr.tsx",
      "src/compat/index.tsx",
      "src/compat/link.tsx",
      "src/compat/navigation.tsx",
      "src/compat/navigation.react-server.tsx",
      "src/compat/image.tsx",
      "src/compat/font/local.tsx",
      "src/compat/font/google.tsx",
    ],
    format: ["esm"],
    external: [],
  },
]);
