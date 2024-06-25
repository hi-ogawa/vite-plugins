import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: [
      "src/internal/plugin.ts",
      "src/internal/entry-browser.tsx",
      "src/internal/entry-ssr.tsx",
      "src/index.tsx",
      "src/link.tsx",
      "src/navigation.tsx",
      "src/navigation.react-server.tsx",
      "src/image.tsx",
      "src/font/local.tsx",
      "src/font/google.tsx",
    ],
    format: ["esm"],
    external: [],
  },
]);
