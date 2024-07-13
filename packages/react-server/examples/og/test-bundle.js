import path from "node:path";
import { nodeFileTrace } from "@vercel/nft";
import * as esbuild from "esbuild";

async function main() {
  const [arg = "esbuild"] = process.argv.slice(2);

  const entry = path.join(import.meta.dirname, "dist/server/index.js");

  if (arg === "nft") {
    const result = await nodeFileTrace([entry], {
      // set pnpm project root to correctly traverse dependency
      base: path.join(import.meta.dirname, "../../../.."),
    });
    console.log(result);
  }

  if (arg === "esbuild") {
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
  }
}

main();
