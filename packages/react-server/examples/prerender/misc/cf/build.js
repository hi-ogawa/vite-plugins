// @ts-check

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as esbuild from "esbuild";

const buildDir = join(import.meta.dirname, "../../dist");
const outDir = join(import.meta.dirname, "dist");

async function main() {
  // clean
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  // assets
  await cp(join(buildDir, "client"), outDir, {
    recursive: true,
  });

  // prerender routes
  // https://developers.cloudflare.com/pages/functions/routing/#create-a-_routesjson-file
  /** @type {import("@hiogawa/react-server/plugin").PrerenderManifest} */
  const { entries } = JSON.parse(
    await readFile(join(buildDir, "client/__prerender.json"), "utf-8"),
  );
  const exclude = [
    "/favicon.ico",
    "/assets/*",
    ...entries.flatMap((e) => [e.route, e.data]),
  ];
  const routesJson = {
    version: 1,
    include: ["/*"],
    exclude,
  };
  await writeFile(
    join(outDir, "_routes.json"),
    JSON.stringify(routesJson, null, 2),
  );

  // headers
  // https://developers.cloudflare.com/pages/configuration/headers/
  await writeFile(
    join(outDir, "_headers"),
    `\
/favicon.ico
  Cache-Control: public, max-age=3600, s-maxage=3600
/assets/*
  Cache-Control: public, max-age=31536000, immutable
`,
  );

  // worker
  // https://developers.cloudflare.com/pages/functions/advanced-mode/
  await esbuild.build({
    entryPoints: [join(buildDir, "server/index.js")],
    outfile: join(outDir, "_worker.js"),
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
