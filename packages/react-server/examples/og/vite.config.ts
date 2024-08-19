import fs from "node:fs";
import path from "node:path";
import MagicString from "magic-string";
import next from "next/vite";
import { type ConfigEnv, type Plugin, defineConfig } from "vite";

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

// cf. https://github.com/hi-ogawa/vite-plugins/blob/998561660c8a27e067e976d4ede9dca53984d41a/packages/react-server/examples/basic/vite-plugin-wasm-module.ts
//
// input
//   import wasm from "xxx.wasm?module"
//
// output (fs / dev)
//   ??
//
// output (fs / build)
//   ??
//
// output (import / build)
//   ??
//
function wasmModulePlugin(options: { mode: "fs" | "import" }): Plugin {
  const MARKER = "\0:virtual:wasm-module";
  let env: ConfigEnv;

  return {
    name: wasmModulePlugin.name,
    config(_, env_) {
      env = env_;
    },
    resolveId: {
      order: "pre",
      async handler(source, importer, options) {
        if (source.endsWith(".wasm?module")) {
          const resolved = await this.resolve(
            source.slice(0, -"?module".length),
            importer,
            options,
          );
          if (resolved) {
            return { id: MARKER + resolved.id };
          }
        }
      },
    },
    load(id) {
      if (id.startsWith(MARKER)) {
        const file = id.slice(MARKER.length);

        // readFile + instantiate wasm module
        if (options.mode === "fs") {
          let source: string;
          if (env.command === "serve") {
            source = JSON.stringify(file);
          } else {
            const referenceId = this.emitFile({
              type: "asset",
              name: path.basename(file),
              source: fs.readFileSync(file),
            });
            source = `fileURLToPath(import.meta.ROLLUP_FILE_URL_${referenceId})`;
          }
          return `
            import fs from "node:fs";
            import { fileURLToPath } from "node:url";
            const buffer = fs.readFileSync(${source});
            export default new WebAssembly.Module(buffer);
          `;
        }

        // emit wasm asset + rewrite import
        if (options.mode === "import") {
          if (env.command === "serve") {
            throw new Error("unsupported");
          }
          const referenceId = this.emitFile({
            type: "asset",
            name: path.basename(file),
            source: fs.readFileSync(file),
          });
          // temporary placeholder which we replace during `renderChunk`
          return `export default "__WASM_MODULE_IMPORT_${referenceId}"`;
        }
      }
    },
    renderChunk(code, chunk) {
      const matches = code.matchAll(/"__WASM_MODULE_IMPORT_(\w+)"/dg);
      const output = new MagicString(code);
      for (const match of matches) {
        const referenceId = match[1];
        const assetFileName = this.getFileName(referenceId);
        const importSource =
          "./" +
          path.relative(
            path.resolve(chunk.fileName, ".."),
            path.resolve(assetFileName),
          );
        const importName = `__wasm_${referenceId}`;
        const [start, end] = match.indices![0];
        output.prepend(`import ${importName} from "${importSource}";\n`);
        output.update(start, end, importName);
      }
      if (output.hasChanged()) {
        return output.toString();
      }
    },
  };
}

//
// input
//   fetch(new URL("./xxx", import.meta.url))
//
// output (fs / dev)
//   new Response(fs.readFileSync("/absolute-path-to/xxx")
//
// output (fs / build)
//   import("node:fs").then(fs => new Response(fs.readFileSync(new URL("./relocated-xxx", import.meta.url).href)))
//
// output (import / build)
//   import("./relocated-xxx.bin").then(mod => new Response(mod.default))
//
function fetchImportMetaUrlPlugin(options: { mode: "fs" | "import" }): Plugin {
  // cf. https://github.com/vitejs/vite/blob/0f56e1724162df76fffd5508148db118767ebe32/packages/vite/src/node/plugins/assetImportMetaUrl.ts#L51-L52
  const FETCH_ASSET_RE =
    /\bfetch\s*\(new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\)\s*(?:,\s*)?\)/dg;

  let env: ConfigEnv;

  return {
    name: fetchImportMetaUrlPlugin.name,
    config(_, env_) {
      env = env_;
    },
    transform(code, id) {
      if (code.includes("import.meta.url")) {
        const output = new MagicString(code);
        const matches = code.matchAll(FETCH_ASSET_RE);
        for (const match of matches) {
          const urlArg = match[1]!.slice(1, -1);
          const absFile = path.resolve(id, "..", urlArg);
          if (fs.existsSync(absFile)) {
            let replacement!: string;
            if (options.mode === "fs") {
              if (env.command === "serve") {
                replacement = `((async () => {
                  const fs = await import("node:fs");
                  return new Response(fs.readFileSync(${JSON.stringify(absFile)}));
                })())`;
              } else {
                const referenceId = this.emitFile({
                  type: "asset",
                  name: path.basename(absFile),
                  source: fs.readFileSync(absFile),
                });
                replacement = `((async () => {
                  const fs = await import("node:fs");
                  const { fileURLToPath } = await import("node:url");
                  return new Response(fs.readFileSync(fileURLToPath(import.meta.ROLLUP_FILE_URL_${referenceId})));
                })())`;
              }
            }
            if (options.mode === "import") {
              if (env.command === "serve") {
                throw new Error("unsupported");
              }
              const referenceId = this.emitFile({
                type: "asset",
                name: path.basename(absFile) + ".bin",
                source: fs.readFileSync(absFile),
              });
              replacement = `"__FETCH_ASSET_IMPORT_${referenceId}".then(mod => new Response(mod.default))`;
            }
            const [start, end] = match.indices![0]!;
            output.update(start, end, replacement);
          }
        }
        if (output.hasChanged()) {
          return { code: output.toString(), map: output.generateMap() };
        }
      }
    },
    renderChunk(code, chunk) {
      const matches = code.matchAll(/"__FETCH_ASSET_IMPORT_(\w+)"/dg);
      const output = new MagicString(code);
      for (const match of matches) {
        const referenceId = match[1];
        const assetFileName = this.getFileName(referenceId);
        const importSource =
          "./" +
          path.relative(
            path.resolve(chunk.fileName, ".."),
            path.resolve(assetFileName),
          );
        const [start, end] = match.indices![0];
        const replacement = `import(${JSON.stringify(importSource)})`;
        output.update(start, end, replacement);
      }
      if (output.hasChanged()) {
        return output.toString();
      }
    },
  };
}
