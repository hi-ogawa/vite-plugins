// @ts-check

import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import * as esbuild from "esbuild";

const buildDir = join(import.meta.dirname, "../../dist");
const outDir = join(import.meta.dirname, "dist");

async function main() {
  // clean
  await rm(outDir, { recursive: true, force: true });

  // assets
  await mkdir(join(outDir, "assets"), { recursive: true });
  await cp(join(buildDir, "client"), join(outDir, "assets"), {
    recursive: true,
  });

  // worker
  await esbuild.build({
    entryPoints: [join(buildDir, "server/index.js")],
    outfile: join(outDir, "main.js"),
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
