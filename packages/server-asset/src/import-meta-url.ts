import fs from "node:fs";
import path from "node:path";
import MagicString from "magic-string";
import { type ConfigEnv, type Plugin } from "vite";

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
// output (inline)
//   new Response(Uint8Array.from(...base64...))
//
// output (import)
//   import("./relocated-xxx.bin").then(mod => new Response(mod.default))
//
export function vitePluginFetchUrlImportMetaUrl(options: {
  buildMode: "fs" | "inline" | "import";
}): Plugin {
  let env: ConfigEnv;

  return {
    name: vitePluginFetchUrlImportMetaUrl.name,
    config(_, env_) {
      env = env_;
    },
    transform(code, id) {
      if (code.includes("import.meta.url")) {
        const output = new MagicString(code);
        const matches = code.matchAll(FETCH_URL_RE);
        for (const match of matches) {
          const urlArg = match[1]!.slice(1, -1);
          const absFile = path.resolve(id, "..", urlArg);
          if (fs.existsSync(absFile)) {
            let replacement!: string;
            if (env.command === "serve" || options.buildMode === "fs") {
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
            } else if (options.buildMode === "inline") {
              const base64 = fs.readFileSync(absFile).toString("base64");
              replacement = `Promise.resolve(new Response(Uint8Array.from(atob("${base64}"), c => c.charCodeAt(0))))`;
            } else if (options.buildMode === "import") {
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
      return;
    },
    renderChunk(code, chunk) {
      const matches = code.matchAll(/"__FETCH_ASSET_IMPORT_(\w+)"/dg);
      const output = new MagicString(code);
      for (const match of matches) {
        const referenceId = match[1]!;
        const assetFileName = this.getFileName(referenceId);
        const importSource =
          "./" +
          path.relative(
            path.resolve(chunk.fileName, ".."),
            path.resolve(assetFileName),
          );
        const [start, end] = match.indices![0]!;
        const replacement = `import(${JSON.stringify(importSource)})`;
        output.update(start, end, replacement);
      }
      if (output.hasChanged()) {
        return output.toString();
      }
      return;
    },
  };
}

// cf. https://github.com/vitejs/vite/blob/0f56e1724162df76fffd5508148db118767ebe32/packages/vite/src/node/plugins/assetImportMetaUrl.ts#L51-L52
export const FETCH_URL_RE =
  /\bfetch\s*\(\s*new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\)\s*(?:,\s*)?\)/dg;
