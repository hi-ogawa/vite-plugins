import rsc from "@hiogawa/vite-rsc/plugin";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import inspect from "vite-plugin-inspect";

export default defineConfig({
  plugins: [
    mdx(),
    react(),
    rsc({
      entries: {
        client: "./src/entry.browser.tsx",
        rsc: "./src/entry.rsc.tsx",
        ssr: "@hiogawa/vite-rsc/extra/ssr",
      },
    }),
    inspect(),
  ],
});
