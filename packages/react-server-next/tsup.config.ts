import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: [
      "src/cli.ts",
      "src/vite/index.ts",
      "src/vite/entry-ssr.tsx",
      "src/vite/adapters/cloudflare/entry.ts",
      "src/vite/adapters/vercel/entry.ts",
      "src/vite/adapters/vercel-edge/entry.ts",
      "src/compat/index.tsx",
      "src/compat/link.tsx",
      "src/compat/navigation.tsx",
      "src/compat/navigation.react-server.tsx",
      "src/compat/headers.tsx",
      "src/compat/image.tsx",
      "src/compat/cache.tsx",
      "src/compat/og.tsx",
      "src/compat/server.tsx",
      "src/compat/font/local.tsx",
      "src/compat/font/google.tsx",
    ],
    format: ["esm"],
    dts: true,
    external: [],
  },
]);
