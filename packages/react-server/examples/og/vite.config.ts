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
        nextEdgeWasmPlugin(),
        nextEdgeAssetPlugin(),
      ],
    }),
  ],
});

// cf. packages/react-server/examples/basic/vite-plugin-wasm-module.ts
function nextEdgeWasmPlugin(): Plugin {
  const MARKER = "\0:virtual:wasm-module";
  let env: ConfigEnv;
  return {
    name: nextEdgeWasmPlugin.name,
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
        if (env.command === "serve") {
          return `
            import fs from "node:fs";
            const buffer = fs.readFileSync(${JSON.stringify(file)});
            export default new WebAssembly.Module(buffer);
          `;
        }

        // emit wasm asset + rewrite import
        if (env.command === "build") {
          const referenceId = this.emitFile({
            type: "asset",
            name: path.basename(file),
            source: fs.readFileSync(file),
          });
          // temporary placeholder which we replace during `renderChunk`
          return `export default "__WASM_IMPORT_URL_${referenceId}"`;
        }
      }
    },
    renderChunk(code, chunk) {
      const matches = code.matchAll(/"__WASM_IMPORT_URL_(\w+)"/dg);
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
//   fetch(new URL("some-asset.bin", import.meta.url))
//
// output (dev)
//   import("node:fs").then(fs => new Response(fs.readFileSync(...)))
//
// output (build)
//   ???
//
function nextEdgeAssetPlugin(): Plugin {
  // cf. https://github.com/vitejs/vite/blob/0f56e1724162df76fffd5508148db118767ebe32/packages/vite/src/node/plugins/assetImportMetaUrl.ts#L51-L52
  const FETCH_ASSET_RE =
    /\bfetch\s*\(new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\)\s*(?:,\s*)?\)/dg;

  let env: ConfigEnv;
  return {
    name: nextEdgeAssetPlugin.name,
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
            let replacement: string;
            if (env.command === "serve") {
              replacement = `import("node:fs").then(fs => new Response(fs.readFileSync(${JSON.stringify(absFile)})))`;
            } else {
              replacement = "todo";
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
  };
}
