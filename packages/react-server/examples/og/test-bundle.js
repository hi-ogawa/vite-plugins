// @ts-check

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

async function main() {
  const [arg = "esbuild"] = process.argv.slice(2);

  const entry = path.join(import.meta.dirname, "dist/server/index.js");

  if (arg === "nft") {
    const { nodeFileTrace } = await import("@vercel/nft");
    const result = await nodeFileTrace([entry], {
      // set pnpm project root to correctly traverse dependency
      base: path.join(import.meta.dirname, "../../../.."),
    });
    console.log(result.fileList);
    for (const [k, v] of result.reasons) {
      if (k.includes("@vercel/og")) {
        console.log(k, v);
      }
    }
  }

  if (arg === "ncc") {
    /** @type {any} */
    const { default: ncc } = await import("@vercel/ncc");
    const result = await ncc(entry, {
      filterAssetBase: path.join(import.meta.dirname, "../../../.."),
    });
    const outDir = path.join(import.meta.dirname, "dist/ncc");
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, "index.js"), result.code);
    for (const [name, { source }] of Object.entries(result.assets)) {
      await writeFile(path.join(outDir, name), source);
    }
  }

  if (arg === "esbuild") {
    const esbuild = await import("esbuild");

    await esbuild.build({
      entryPoints: [entry],
      outfile: path.join(import.meta.dirname, "dist/esbuild"),
      bundle: true,
      format: "esm",
      platform: "node",
      define: {
        "process.env.NODE_ENV": `"production"`,
      },
      logLevel: "info",
      logOverride: {
        "ignored-bare-import": "silent",
      },
    });
  }

  if (arg === "rolldown") {
    const rolldown = await import("rolldown");
    const bundle = await rolldown.rolldown({
      input: entry,
      cwd: import.meta.dirname,
    });
    const outDir = path.join(import.meta.dirname, "dist/rolldown");
    await mkdir(outDir, { recursive: true });
    await bundle.write({
      dir: outDir,
    });
  }

  if (arg === "rollup") {
    const rollup = await import("rollup");
    const bundle = await rollup.rollup({
      input: entry,
    });
    const outDir = path.join(import.meta.dirname, "dist/rollup");
    await mkdir(outDir, { recursive: true });
    await bundle.write({
      dir: outDir,
    });
  }
}

main();
