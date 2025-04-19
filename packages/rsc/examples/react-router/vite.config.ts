import rsc from "@hiogawa/vite-rsc/core2/plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  appType: "custom",
  clearScreen: false,
  build: {
    minify: false,
  },
  plugins: [
    react(),
    rsc({
      entries: {
        browser: "/src/entry.browser.tsx",
        ssr: "/src/entry.ssr.tsx",
        rsc: "/src/entry.rsc.tsx",
      },
    }),
  ],
}) as any;
