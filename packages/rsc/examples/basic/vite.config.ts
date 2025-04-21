import rsc from "@hiogawa/vite-rsc/plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  clearScreen: false,
  plugins: [
    tailwindcss(),
    react(),
    rsc({
      entries: {
        browser: "/src/client.tsx",
        rsc: "/src/server.tsx",
        ssr: "@hiogawa/vite-rsc/extra/ssr",
        css: "/src/styles.css",
      },
    }) as any,
  ],
  build: {
    minify: false,
  },
}) as any;
