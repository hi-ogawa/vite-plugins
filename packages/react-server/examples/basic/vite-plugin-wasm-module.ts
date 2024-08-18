import fs from "node:fs";
import path from "node:path";
import MagicString from "magic-string";
import { type ConfigEnv, type Plugin } from "vite";

// normalize wasm import for various environments
// - CF (including Vercel Edge): keep import "xxx.wasm"
// - Others: replace it with explicit instantiation of `WebAssembly.Module`
//   - inline
//   - local asset + fs.readFile

// references
// https://developers.cloudflare.com/pages/functions/module-support/#webassembly-modules
// https://github.com/withastro/adapters/blob/cd4c0842aadc58defc67f4ccf6d6ef6f0401a9ac/packages/cloudflare/src/utils/cloudflare-module-loader.ts#L213-L216
// https://vercel.com/docs/functions/wasm
// https://github.com/unjs/unwasm

export function wasmModulePlugin(options: {
  mode: "inline" | "asset-fs" | "asset-import";
}): Plugin {
  let env: ConfigEnv;
  return {
    name: wasmModulePlugin.name,
    config(_config, env_) {
      env = env_;
    },
    load(id) {
      if (id.endsWith(".wasm")) {
        // inline + WebAssembly.Module
        if (options.mode === "inline") {
          const base64 = fs.readFileSync(id).toString("base64");
          return `
            const buffer = Uint8Array.from(atob("${base64}"), c => c.charCodeAt(0));
            export default new WebAssembly.Module(buffer);
          `;
        }

        // file + WebAssembly.Module
        if (options.mode === "asset-fs") {
          let source = JSON.stringify(id);
          if (env.command === "build") {
            const referenceId = this.emitFile({
              type: "asset",
              name: path.basename(id),
              source: fs.readFileSync(id),
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

        // keep wasm import
        if (options.mode === "asset-import") {
          if (env.command === "build") {
            const referenceId = this.emitFile({
              type: "asset",
              name: path.basename(id),
              source: fs.readFileSync(id),
            });
            // temporary placeholder replaced during renderChunk
            return `export default "__WASM_IMPORT_URL_${referenceId}"`;
          }
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
