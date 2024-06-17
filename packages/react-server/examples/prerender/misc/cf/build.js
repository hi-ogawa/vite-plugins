// @ts-check

import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import * as esbuild from "esbuild";
import { spawnSync } from "node:child_process";

const buildDir = join(import.meta.dirname, "../../dist");
const outDir = join(import.meta.dirname, "dist");

async function main() {
  // clean
  await rm(outDir, { recursive: true, force: true });
  await mkdir(join(outDir, "client"), { recursive: true });

  // static
  await cp(join(buildDir, "client"), join(outDir, "client"), {
    recursive: true,
  });

  // TODO: move it to here
  // node ./build.mjs
  spawnSync("node", [join(import.meta.dirname, "index.mjs")]);

  // server
  await esbuild.build({
    entryPoints: [join(buildDir, "server/index.js")],
    outfile: join(outDir, "client/_worker.js"),
    metafile: true,
    bundle: true,
    minify: true,
    format: "esm",
    platform: "browser",
    define: {
      "process.env.NODE_ENV": `"production"`,
    },
    logOverride: {
      "ignored-bare-import": "silent",
    },
  });
}

main();
