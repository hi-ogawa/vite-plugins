import next from "next/vite";
import { defineConfig } from "vite";
import { fetchImportMetaUrlPlugin, wasmModulePlugin } from "./vite-plugins";

export default defineConfig({
  plugins: [
    next({
      plugins: [
        {
          name: "config",
          config() {
            return {
              resolve: {
                alias: {
                  "@vercel/og": "/node_modules/@vercel/og/dist/index.edge.js",
                },
              },
            };
          },
        },
        wasmModulePlugin({ mode: process.env.CF_PAGES ? "import" : "fs" }),
        fetchImportMetaUrlPlugin({
          mode: process.env.CF_PAGES ? "import" : "fs",
        }),
      ],
    }),
  ],
});
