import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as esbuild from "esbuild";
import MagicString from "magic-string";
import type { Plugin } from "vite";

export function vitePluginPreBundleNewUrl(options?: {
  filter?: RegExp;
  debug?: boolean;
}): Plugin {
  return {
    name: "pre-bundle-new-url",
    config() {
      return {
        optimizeDeps: {
          esbuildOptions: {
            plugins: [esbuildPluginPreBundleNewUrl({ ...options })],
          },
        },
      };
    },
  };
}

export function esbuildPluginPreBundleNewUrl({
  filter = /\.m?js$/,
  debug,
  buildChain = [],
  buildPromiseMap = new Map(),
}: {
  filter?: RegExp;
  debug?: boolean;
  // track recursive worker build
  buildChain?: string[];
  buildPromiseMap?: Map<string, ReturnType<typeof esbuild.build>>;
}): esbuild.Plugin {
  return {
    name: esbuildPluginPreBundleNewUrl.name,
    setup(build) {
      // do nothing during dep-scan
      if (
        build.initialOptions.plugins?.find((p) => p.name === "vite:dep-scan")
      ) {
        return;
      }

      let outdir: string;
      build.onStart(() => {
        outdir = build.initialOptions.outdir!;
      });

      build.onLoad({ filter, namespace: "file" }, async (args) => {
        const data = await fs.promises.readFile(args.path, "utf-8");
        if (data.includes("import.meta.url")) {
          const output = new MagicString(data);
          const workerMatched = new Set<number>();

          // replace
          //   new Worker(new URL("./worker.js", import.meta.url))
          // with
          //   new Worker(new URL("/__worker-(name)-(hash).js", import.meta.url))
          {
            const matches = data.matchAll(workerImportMetaUrlRE);
            for (const match of matches) {
              const [urlStart, urlEnd] = match.indices![2]!;
              workerMatched.add(urlStart);

              const url = match[2]!.slice(1, -1);
              if (url[0] !== "/") {
                // TODO: use build.resolve? https://esbuild.github.io/plugins/#resolve
                // however esbuild requires explicit "./", so need to resolve twice for
                // - build.resolve("relative-or-package")
                // - build.resolve("./relative-or-package")
                const absUrl = path.resolve(path.dirname(args.path), url);

                if (fs.existsSync(absUrl)) {
                  // handle circular worker import similar to vite build
                  if (buildChain.at(-1) === absUrl) {
                    output.update(urlStart, urlEnd, "self.location.href");
                    continue;
                  }
                  if (buildChain.includes(absUrl)) {
                    throw new Error(
                      "Unsupported circular worker imports: " +
                        [...buildChain, "..."].join(" -> "),
                    );
                  }
                  let bundlePromise = buildPromiseMap.get(absUrl);
                  if (!bundlePromise) {
                    const entryName = makeOutputFilename(absUrl);
                    bundlePromise = esbuild.build({
                      // inherit config
                      absWorkingDir: build.initialOptions.absWorkingDir,
                      outdir: build.initialOptions.outdir,
                      platform: build.initialOptions.platform,
                      define: build.initialOptions.define,
                      target: build.initialOptions.target,
                      // own config
                      entryPoints: {
                        [entryName]: absUrl,
                      },
                      entryNames: "./__worker-[name]-[hash]",
                      bundle: true,
                      metafile: true,
                      // TODO: should we detect WorkerType and use esm only when `{ type: "module" }`?
                      format: "esm",
                      // TODO: worker condition? https://github.com/vitejs/vite/issues/7439
                      // conditions: ["worker"],
                      plugins: [
                        esbuildPluginPreBundleNewUrl({
                          filter,
                          debug,
                          buildChain: [...buildChain, absUrl],
                          buildPromiseMap: buildPromiseMap,
                        }),
                      ],
                    });
                    buildPromiseMap.set(absUrl, bundlePromise);
                  }
                  const result = await bundlePromise;
                  const filename = path.basename(
                    Object.keys(result.metafile!.outputs)[0]!,
                  );
                  output.update(
                    urlStart,
                    urlEnd,
                    JSON.stringify(`./${filename}`),
                  );
                }
              }
            }
          }

          // replace
          //   new URL("./asset.svg", import.meta.url)
          // with
          //   new URL("./__asset-(name)-(hash).svg", import.meta.url)
          {
            const matches = data.matchAll(assetImportMetaUrlRE);
            for (const match of matches) {
              const [urlStart, urlEnd] = match.indices![1]!;
              if (workerMatched.has(urlStart)) {
                continue;
              }
              const url = match[1]!.slice(1, -1);
              if (url[0] !== "/") {
                const absUrl = path.resolve(path.dirname(args.path), url);
                if (fs.existsSync(absUrl)) {
                  const assetName = makeOutputFilename(absUrl);
                  const assetData = await fs.promises.readFile(absUrl);
                  const hash = crypto
                    .createHash("sha1")
                    .update(assetData)
                    .digest()
                    .toString("hex")
                    .slice(0, 8);
                  const filename =
                    `__asset-${assetName}-${hash}` + path.extname(absUrl);
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
          }

          if (output.hasChanged()) {
            return {
              loader: "js",
              contents: output.toString(),
            };
          }
        }
        return null;
      });
    },
  };
}

function makeOutputFilename(id: string) {
  return id
    .split("/node_modules/")
    .at(-1)!
    .replace(/[^0-9a-zA-Z]/g, "_");
}

// https://github.com/vitejs/vite/blob/0f56e1724162df76fffd5508148db118767ebe32/packages/vite/src/node/plugins/assetImportMetaUrl.ts#L51-L52
const assetImportMetaUrlRE =
  /\bnew\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\)/dg;

// https://github.com/vitejs/vite/blob/0f56e1724162df76fffd5508148db118767ebe32/packages/vite/src/node/plugins/workerImportMetaUrl.ts#L133-L134
const workerImportMetaUrlRE =
  /\bnew\s+(?:Worker|SharedWorker)\s*\(\s*(new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*\))/dg;
