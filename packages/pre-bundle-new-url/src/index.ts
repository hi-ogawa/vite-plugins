import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as esbuild from "esbuild";
import MagicString from "magic-string";
import type { Plugin, ResolvedConfig } from "vite";

export function vitePluginPreBundleNewUrl(options?: {
  filter?: RegExp;
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
                filter: options?.filter,
                getResolvedConfig: () => resolvedConfig,
              }),
            ],
          },
        },
      };
    },
    configResolved(config) {
      resolvedConfig = config;
    },
  };
}

function esbuildPluginNewUrl(options: {
  filter?: RegExp;
  getResolvedConfig: () => ResolvedConfig;
}): esbuild.Plugin {
  return {
    name: esbuildPluginNewUrl.name,
    setup(build) {
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
                  const workerType = getWorkerType(
                    data,
                    data,
                    match.indices![0]![1],
                  );
                  const outfile = path.resolve(
                    resolvedConfig.cacheDir,
                    "__worker",
                    hashString(absUrl + workerType) + ".js",
                  );
                  // recursively bundle worker
                  if (
                    resolvedConfig.optimizeDeps.force ||
                    !fs.existsSync(outfile)
                  ) {
                    await esbuild.build({
                      outfile,
                      entryPoints: [absUrl],
                      bundle: true,
                      format: workerType === "module" ? "esm" : "iife",
                      plugins:
                        workerType === "module"
                          ? [esbuildPluginNewUrl(options)]
                          : undefined,
                      banner: {
                        // https://github.com/vitejs/vite/issues/17826
                        // without this separator, Vite breaks the code by injecting
                        //   importScripts("/@vite/env")(() => ...)()
                        js: ";\n",
                      },
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

function hashString(s: string) {
  return crypto
    .createHash("sha256")
    .update(s)
    .digest()
    .toString("hex")
    .slice(0, 10);
}

//
// copied from Vite
//

// https://github.com/vitejs/vite/blob/0f56e1724162df76fffd5508148db118767ebe32/packages/vite/src/node/plugins/assetImportMetaUrl.ts#L51-L52
const assetImportMetaUrlRE =
  /\bnew\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\)/dg;

// https://github.com/vitejs/vite/blob/0f56e1724162df76fffd5508148db118767ebe32/packages/vite/src/node/plugins/workerImportMetaUrl.ts#L133-L134
const workerImportMetaUrlRE =
  /\bnew\s+(?:Worker|SharedWorker)\s*\(\s*(new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*\))/dg;

const hasViteIgnoreRE = /\/\*\s*@vite-ignore\s*\*\//;

// https://github.com/vitejs/vite/blob/4e96e1243c8a4e076aff5d67edbaca8459fe5b1f/packages/vite/src/node/plugins/workerImportMetaUrl.ts#L56
function getWorkerType(
  raw: string,
  clean: string,
  i: number,
): WorkerType | "ignore" {
  const commaIndex = clean.indexOf(",", i);
  if (commaIndex === -1) {
    return "classic";
  }
  const endIndex = clean.indexOf(")", i);

  // case: ') ... ,' mean no worker options params
  if (commaIndex > endIndex) {
    return "classic";
  }

  // need to find in comment code
  const workerOptString = raw
    .substring(commaIndex + 1, endIndex)
    .replace(/\}[\s\S]*,/g, "}"); // strip trailing comma for parsing

  const hasViteIgnore = hasViteIgnoreRE.test(workerOptString);
  if (hasViteIgnore) {
    return "ignore";
  }

  // need to find in no comment code
  const cleanWorkerOptString = clean.substring(commaIndex + 1, endIndex).trim();
  if (!cleanWorkerOptString.length) {
    return "classic";
  }

  const workerOpts = parseWorkerOptions(workerOptString);
  if (
    workerOpts.type &&
    (workerOpts.type === "module" || workerOpts.type === "classic")
  ) {
    return workerOpts.type;
  }

  return "classic";
}

function parseWorkerOptions(rawOpts: string): WorkerOptions {
  let opts: WorkerOptions = {};
  try {
    opts = evalValue<WorkerOptions>(rawOpts);
  } catch {
    throw Error(
      "Vite is unable to parse the worker options as the value is not static." +
        "To ignore this error, please use /* @vite-ignore */ in the worker options.",
    );
  }

  if (opts == null) {
    return {};
  }

  if (typeof opts !== "object") {
    throw Error(`Expected worker options to be an object, got ${typeof opts}`);
  }

  return opts;
}

function evalValue<T = any>(rawValue: string): T {
  const fn = new Function(`
    var console, exports, global, module, process, require
    return (\n${rawValue}\n)
  `);
  return fn();
}
