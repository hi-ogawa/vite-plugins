import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as esbuild from "esbuild";
import MagicString from "magic-string";
import type { Plugin, ResolvedConfig } from "vite";

export function vitePluginPreBundleNewUrl(options?: {
  filter?: RegExp;
  debug?: boolean;
}): Plugin {
  let resolvedConfig: ResolvedConfig;

  return {
    name: "pre-bundle-new-url",
    config() {
      return {
        optimizeDeps: {
          esbuildOptions: {
            plugins: [
              esbuildPluginNewUrl({
                ...options,
                getResolvedConfig: () => resolvedConfig,
              }),
            ],
          },
        },
      };
    },
    async configResolved(config) {
      resolvedConfig = config;
      if (resolvedConfig.optimizeDeps.force) {
        await fs.promises.rm(
          path.resolve(resolvedConfig.cacheDir, "__worker"),
          { recursive: true, force: true },
        );
      }
    },
  };
}

// track which worker is built to handle recursive worker such as
// https://github.com/gkjohnson/three-mesh-bvh/blob/9718501eee2619f1015fa332d7bddafaf6cf562a/src/workers/parallelMeshBVH.worker.js#L12
let buildPromiseMap = new Map<string, Promise<unknown>>();

function esbuildPluginNewUrl(options: {
  filter?: RegExp;
  debug?: boolean;
  getResolvedConfig: () => ResolvedConfig;
}): esbuild.Plugin {
  return {
    name: esbuildPluginNewUrl.name,
    setup(build) {
      // do nothing during dep-scan
      if (
        build.initialOptions.plugins?.find((p) => p.name === "vite:dep-scan")
      ) {
        return;
      }

      const resolvedConfig = options.getResolvedConfig();
      const filter = options.filter ?? /\.js$/;

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
                const absUrl = path.resolve(path.dirname(args.path), url);
                if (fs.existsSync(absUrl)) {
                  const outfile = path.resolve(
                    resolvedConfig.cacheDir,
                    "__worker",
                    hashString(absUrl) + ".js",
                  );
                  // recursively bundle worker
                  let buildPromise = buildPromiseMap.get(outfile);
                  if (!fs.existsSync(outfile) && !buildPromise) {
                    if (options.debug) {
                      console.log(
                        "[pre-bundenew-url]",
                        args.path,
                        "=>",
                        absUrl,
                      );
                    }
                    buildPromise = esbuild.build({
                      outfile,
                      entryPoints: [absUrl],
                      bundle: true,
                      // TODO: should we detect WorkerType and use esm only when `{ type: "module" }`?
                      format: "esm",
                      platform: "browser",
                      plugins: [esbuildPluginNewUrl(options)],
                      banner: {
                        // https://github.com/vitejs/vite/issues/17826
                        // without this separator, Vite breaks the code by injecting
                        //   importScripts("/@vite/env")(() => ...)()
                        js: ";\n",
                      },
                      logLevel: options.debug ? "debug" : undefined,
                    });
                    buildPromiseMap.set(outfile, buildPromise);
                    await buildPromise
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
