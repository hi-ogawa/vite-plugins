import { readFile } from "node:fs/promises";
import path from "node:path";
import MagicString from "magic-string";
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
          name: "binary-data-url",
          async transform(code, id, _options) {
            // input:
            //   new URL("./some-font.ttf", import.meta.url)
            // output:
            //   new URL("data:application/octet-stream;base64,...")

            // https://github.com/vitejs/vite/blob/ec16a5efc04d8ab50301d184c20e7bd0c8d8f6a2/packages/vite/src/node/plugins/assetImportMetaUrl.ts
            const assetImportMetaUrlRE =
              /\bnew\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\)/dg;
            let match: RegExpExecArray | null;
            let s: MagicString | undefined;
            while ((match = assetImportMetaUrlRE.exec(code))) {
              s ??= new MagicString(code);
              const [[startIndex, endIndex], [urlStart, urlEnd]] =
                match.indices!;
              const url = code.slice(urlStart, urlEnd).slice(1, -1);
              if (url[0] === ".") {
                const file = path.resolve(path.dirname(id), url);
                const data = await readFile(file, "base64");
                s.update(
                  startIndex,
                  endIndex,
                  `new URL(${JSON.stringify("data:application/octet-stream;base64," + data)})`,
                );
              }
            }
            if (s?.hasChanged()) {
              return { code: s.toString(), map: s.generateMap() };
            }
          },
        },
      ],
    }),
  ],
});
