import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type * as esbuild from "esbuild";
import MagicString from "magic-string";

// cf. https://github.com/hi-ogawa/vite-plugins/blob/998561660c8a27e067e976d4ede9dca53984d41a/packages/pre-bundle-new-url/src/index.ts#L26
export function esbuildPluginAssetImportMetaUrl(): esbuild.Plugin {
  return {
    name: esbuildPluginAssetImportMetaUrl.name,
    setup(build) {
      let outdir: string;
      build.onStart(() => {
        if (build.initialOptions.outdir) {
          outdir = build.initialOptions.outdir;
        }
        if (build.initialOptions.outfile) {
          outdir = path.dirname(build.initialOptions.outfile);
        }
        if (!outdir) {
          throw new Error("unreachable");
        }
      });

      build.onLoad(
        { filter: /\.[cm]?js$/, namespace: "file" },
        async (args) => {
          const data = await fs.promises.readFile(args.path, "utf-8");
          if (data.includes("import.meta.url")) {
            const output = new MagicString(data);

            // replace
            //   new URL("./xxx.bin", import.meta.url)
            // with
            //   new URL("./__asset-xxx-(hash).bin", import.meta.url)
            const matches = data.matchAll(assetImportMetaUrlRE);
            for (const match of matches) {
              const [urlStart, urlEnd] = match.indices![1]!;
              const url = match[1]!.slice(1, -1);
              if (url[0] !== "/") {
                const absUrl = path.resolve(path.dirname(args.path), url);
                if (fs.existsSync(absUrl)) {
                  const assetData = await fs.promises.readFile(absUrl);
                  const hash = crypto
                    .createHash("sha1")
                    .update(assetData)
                    .digest()
                    .toString("hex")
                    .slice(0, 8);
                  const name = path
                    .basename(absUrl)
                    .replace(/[^0-9a-zA-Z]/g, "_");
                  const filename =
                    `__asset-${name}-${hash}` + path.extname(absUrl);
                  await fs.promises.writeFile(
                    path.join(outdir, filename),
                    assetData,
                  );
                  output.update(
                    urlStart,
                    urlEnd,
                    JSON.stringify(`./${filename}`),
                  );
                }
              }
            }
            if (output.hasChanged()) {
              return {
                loader: "js",
                contents: output.toString(),
              };
            }
          }
          return null;
        },
      );
    },
  };
}

// https://github.com/vitejs/vite/blob/0f56e1724162df76fffd5508148db118767ebe32/packages/vite/src/node/plugins/assetImportMetaUrl.ts#L51-L52
const assetImportMetaUrlRE =
  /\bnew\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\)/dg;
