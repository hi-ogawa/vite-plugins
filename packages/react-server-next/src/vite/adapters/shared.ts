import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { BuildOptions } from "esbuild";

// cf.
// https://github.com/sveltejs/kit/blob/144fb75c8280695d8aeb3228904bebb262e171a7/packages/adapter-cloudflare/index.js

export async function bundleEdge(buildDir: string, options: BuildOptions) {
  const esbuild = await import("esbuild");
  const result = await esbuild.build({
    bundle: true,
    minify: true,
    metafile: true,
    format: "esm",
    platform: "browser",
    external: ["node:async_hooks"],
    define: {
      "process.env.NODE_ENV": `"production"`,
    },
    logOverride: {
      "ignored-bare-import": "silent",
    },
    loader: {
      ".wasm": "copy",
    },
    ...options,
  });
  await writeFile(
    join(buildDir, "esbuild-metafile.json"),
    JSON.stringify(result.metafile),
  );
}
