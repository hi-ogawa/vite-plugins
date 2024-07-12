import { readFile } from "node:fs/promises";
import path from "node:path";
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
                  "@vercel/og": "/node_modules/@vercel/og/dist/index.edge.js",
                  // "@vercel/og": "/node_modules/@vercel/og/dist/index.node.js",
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
              const data = await readFile(id, "base64");
              // TODO: on cloudflare, wasm needs to be uploaded as asset.
              return `
                import { Buffer } from "node:buffer";
                export default Buffer.from(${JSON.stringify(data)}, "base64");
              `;
            }
          },
        },
        {
          name: "import-meta-url-asset-binary",
          enforce: "pre",
          async transform(code, id, _options) {
            if (
              code.includes(
                `new URL("./noto-sans-v27-latin-regular.ttf", import.meta.url)`,
              )
            ) {
              const file = path.resolve(
                id,
                "..",
                "noto-sans-v27-latin-regular.ttf",
              );
              const data = await readFile(file, "base64");
              code = code.replace(
                `new URL("./noto-sans-v27-latin-regular.ttf", import.meta.url)`,
                () => `${JSON.stringify("data:text/plain;base64," + data)}`,
              );
              return code;
            }
          },
        },
      ],
    }),
  ],
});
