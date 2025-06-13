import rsc from "@hiogawa/vite-rsc/plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    rsc({
      entries: {
        browser: "./src/entry.browser.tsx",
        rsc: "./src/entry.rsc.tsx",
        ssr: "./src/entry.ssr.tsx",
      },
    }),
  ],
});
