import rsc from "@hiogawa/vite-rsc/plugin";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  plugins: [
    rsc({
      entries: {
        client: "./src/entry.browser.tsx",
        rsc: "./src/entry.rsc.tsx",
        ssr: "./src/entry.ssr.tsx",
      },
    }),
  ],
  build: {
    minify: false,
  },
}) as any;
