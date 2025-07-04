// @ts-check

import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as esbuild from "esbuild";

const buildDir = join(import.meta.dirname, "../../dist");
const outDir = join(import.meta.dirname, "dist");

async function main() {
  // clean
  await rm(outDir, { recursive: true, force: true });

  // assets
  await mkdir(join(outDir, "client"), { recursive: true });
  await cp(join(buildDir, "client"), join(outDir, "client"), {
    recursive: true,
  });

  // worker
  const result = await esbuild.build({
    stdin: {
      contents: `export { default } from "./server/index.js";`,
      resolveDir: buildDir,
    },
    outfile: join(outDir, "main.js"),
    metafile: true,
    bundle: true,
    minify: true,
    format: "esm",
    platform: "browser",
    external: ["node:async_hooks"],
    loader: {
      ".wasm": "copy",
    },
    define: {
      "process.env.NODE_ENV": `"production"`,
    },
    logOverride: {
      "ignored-bare-import": "silent",
    },
  });
  await writeFile(
    join(outDir, "esbuild-metafile.json"),
    JSON.stringify(result.metafile),
  );
}

main();
