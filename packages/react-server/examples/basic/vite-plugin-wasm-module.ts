import fs from "node:fs";
import path from "node:path";
import MagicString from "magic-string";
import { type ConfigEnv, type Plugin } from "vite";

// cf.
// https://developers.cloudflare.com/pages/functions/module-support/#webassembly-modules
// https://github.com/withastro/adapters/blob/cd4c0842aadc58defc67f4ccf6d6ef6f0401a9ac/packages/cloudflare/src/utils/cloudflare-module-loader.ts#L213-L216
// https://vercel.com/docs/functions/wasm
// https://github.com/unjs/unwasm

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
export function wasmModulePlugin(options: { mode: "fs" | "import" }): Plugin {
  const MARKER = "\0virtual:wasm-module";
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

        // readFile + new WebAssembly.Module
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
