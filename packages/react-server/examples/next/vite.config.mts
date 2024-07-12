import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { tinyassert } from "@hiogawa/utils";
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
              if (importer) {
                importer = importer.split(`?`)[0];
                source = source.split("?")[0];
                source = path.resolve(importer, "..", source);
                return "\0virtual:wasm-module" + source;
              }
            }
          },
          async load(id) {
            if (id.startsWith("\0virtual:wasm-module")) {
              id = id.slice("\0virtual:wasm-module".length);
              const data = await readFile(id);
              const dataBase64 = data.toString("base64");
              // TODO: on cloudflare, wasm needs to be uploaded as asset.
              return `
                import { Buffer } from "node:buffer";
                const data = Buffer.from(${JSON.stringify(dataBase64)}, "base64");
                export default WebAssembly.compile(data);
              `;
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
