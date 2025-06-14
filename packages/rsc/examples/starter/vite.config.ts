import rsc from "@hiogawa/vite-rsc/plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import inspect from "vite-plugin-inspect";

export default defineConfig({
  plugins: [
    react(),
    rsc({
      // TODO: use rollupOptions.input instead
      entries: {
        browser: "./src/framework/entry.browser.tsx",
        rsc: "./src/framework/entry.rsc.tsx",
        ssr: "./src/framework/entry.ssr.tsx",
      },
    }),
    inspect({ build: true }),
  ],
  // environments: {
  //   client: {
  //     build: {
  //       rollupOptions: {
  //         input: {
  //           index: "./src/framework/entry.browser.tsx",
  //         },
  //       },
  //     },
  //   },
  //   ssr: {
  //     build: {
  //       rollupOptions: {
  //         input: {
  //           index: "./src/framework/entry.ssr.tsx",
  //         },
  //       },
  //     },
  //   },
  //   rsc: {
  //     build: {
  //       rollupOptions: {
  //         input: {
  //           index: "./src/framework/entry.rsc.tsx",
  //         },
  //       },
  //     },
  //   },
  // },
});
