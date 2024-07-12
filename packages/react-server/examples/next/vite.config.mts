import next from "next/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    next({
      plugins: [
        {
          name: "vercel-og-edge",
          config() {
            return {
              resolve: {
                alias: {
                  // "@vercel/og": "/node_modules/@vercel/og/dist/index.node.js",
                  "@vercel/og": "/node_modules/@vercel/og/dist/index.edge.js",
                },
              },
            };
          },
        },
        {
          name: "import-wasm-module",
          enforce: "pre",
          resolveId(source, importer) {
            if (source.endsWith(".wasm?module")) {
              console.log("[resolveId]", { source, importer });
              return source;
            }
          },
          load(id) {
            if (id.endsWith(".wasm?module")) {
              return `export {}`;
            }
          },
        },
        {
          name: "import-meta-url-asset-binary",
          enforce: "pre",
          transform(code, id, _options) {
            if (code.includes("new URL")) {
              id;
            }
          },
        },
      ],
    }),
  ],
});
