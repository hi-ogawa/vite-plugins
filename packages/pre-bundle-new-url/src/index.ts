import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { tinyassert } from "@hiogawa/utils";
import * as esbuild from "esbuild";
import MagicString from "magic-string";
import type { Plugin } from "vite";

export function vitePluginPreBundleNewUrl(options?: {
  filter?: RegExp;
  debug?: boolean;
}): Plugin {
  let workerOutDir: string;

  return {
    name: "pre-bundle-new-url",
    config() {
      return {
        optimizeDeps: {
          esbuildOptions: {
            plugins: [
              esbuildPluginPreBundleNewUrl({
                ...options,
                visited: new Set(),
                getWorkerOutDir: () => workerOutDir,
              }),
            ],
          },
        },
      };
    },
    async configResolved(config) {
      workerOutDir = path.resolve(config.cacheDir, "__worker");
      if (config.optimizeDeps.force) {
        await fs.promises.rm(workerOutDir, { recursive: true, force: true });
      }
    },
  };
}

export function esbuildPluginPreBundleNewUrl({
  filter = /\.m?js$/,
  debug,
  visited,
  getWorkerOutDir,
}: {
  filter?: RegExp;
  debug?: boolean;
  // track worker build to prevent infinite loop on recursive worker such as
  // https://github.com/gkjohnson/three-mesh-bvh/blob/9718501eee2619f1015fa332d7bddafaf6cf562a/src/workers/parallelMeshBVH.worker.js#L12
  visited: Set<string>;
  getWorkerOutDir: () => string;

  bundleChain?: string[]; // track recursive worker build
  bundleMap?: Map<string, ReturnType<typeof esbuild.build>>;
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

      // TODO: uses .vite/deps_temp_xxx directory
      // https://github.com/vitejs/vite/blob/321b213756a1e69eb0ddc4dc06e59a30db099c8e/packages/vite/src/node/optimizer/index.ts#L810
      tinyassert(build.initialOptions.outdir);

      build.onLoad({ filter, namespace: "file" }, async (args) => {
        const data = await fs.promises.readFile(args.path, "utf-8");
        if (data.includes("import.meta.url")) {
          const output = new MagicString(data);
          const workerMatched = new Set<number>();

          // replace
          //   new Worker(new URL("./worker.js", import.meta.url))
          // with
          //   new Worker(new URL("/absolute/path/to/bundled-worker.js", import.meta.url))
          {
            const matches = data.matchAll(workerImportMetaUrlRE);
            for (const match of matches) {
              const [urlStart, urlEnd] = match.indices![2]!;
              workerMatched.add(urlStart);

              const url = match[2]!.slice(1, -1);
              if (url[0] !== "/") {
                // TODO: use build.resolve
                const absUrl = path.resolve(path.dirname(args.path), url);
                if (fs.existsSync(absUrl)) {
                  const outfile = path.resolve(
                    getWorkerOutDir(),
                    getWorkerFileName(absUrl),
                  );
                  // recursively bundle worker
                  if (!fs.existsSync(outfile) && !visited.has(outfile)) {
                    visited.add(outfile);
                    if (debug) {
                      console.log("[pre-bunde-new-url:worker]", {
                        path: args.path,
                        worker: absUrl,
                        outfile,
                      });
                    }
                    await esbuild.build({
                      outfile,
                      entryPoints: [absUrl],
                      bundle: true,
                      // TODO: should we detect WorkerType and use esm only when `{ type: "module" }`?
                      format: "esm",
                      platform: "browser",
                      plugins: [
                        esbuildPluginPreBundleNewUrl({
                          filter,
                          debug,
                          visited,
                          getWorkerOutDir,
                        }),
                      ],
                      logLevel: debug ? "debug" : undefined,
                    });
                  }
                  output.update(urlStart, urlEnd, JSON.stringify(outfile));
                }
              }
            }
          }

          // replace
          //   new URL("./asset.svg", import.meta.url)
          // with
          //   new URL("/absolute-path-to/asset.svg", import.meta.url)
          {
            const matches = data.matchAll(assetImportMetaUrlRE);
            for (const match of matches) {
              const [argStart, argEnd] = match.indices![1]!;
              if (workerMatched.has(argStart)) {
                continue;
              }
              const url = match[1]!.slice(1, -1);
              if (url[0] !== "/") {
                const absUrl = path.resolve(path.dirname(args.path), url);
                if (fs.existsSync(absUrl)) {
                  output.update(argStart, argEnd, JSON.stringify(absUrl));
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

function getWorkerFileName(file: string) {
  const hash = hashString(file);
  file = file.split("/node_modules/").at(-1)!;
  file = file.slice(0, 100).replace(/[^0-9a-zA-Z]/g, "_");
  return `${file}-${hash}.js`;
}

function hashString(s: string) {
  return crypto
    .createHash("sha256")
    .update(s)
    .digest()
    .toString("hex")
    .slice(0, 10);
}

// https://github.com/vitejs/vite/blob/0f56e1724162df76fffd5508148db118767ebe32/packages/vite/src/node/plugins/assetImportMetaUrl.ts#L51-L52
const assetImportMetaUrlRE =
  /\bnew\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\)/dg;

// https://github.com/vitejs/vite/blob/0f56e1724162df76fffd5508148db118767ebe32/packages/vite/src/node/plugins/workerImportMetaUrl.ts#L133-L134
const workerImportMetaUrlRE =
  /\bnew\s+(?:Worker|SharedWorker)\s*\(\s*(new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*\))/dg;
