// @ts-check

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as esbuild from "esbuild";

const buildDir = join(import.meta.dirname, "../../dist");
const outDir = join(import.meta.dirname, ".vercel/output");

const configJson = {
  version: 3,
  trailingSlash: false,
  routes: [
    {
      src: "^/assets/(.*)$",
      headers: {
        "cache-control": "public, immutable, max-age=31536000",
      },
    },
    {
      handle: "filesystem",
    },
    {
      src: ".*",
      dest: "/",
    },
  ],
  overrides: {},
};

const isNodeRuntime = process.env["VERCE_RUNTIME"];

const vcConfigJson = isNodeRuntime
  ? {
      runtime: "nodejs20.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      regions: ["hnd1"],
    }
  : {
      runtime: "edge",
      entrypoint: "index.mjs",
    };

async function main() {
  // clean
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  // overrides for ssg html
  // https://vercel.com/docs/build-output-api/v3/configuration#overrides
  /** @type {import("@hiogawa/react-server/plugin").PrerenderManifest} */
  const { entries } = JSON.parse(
    await readFile(join(buildDir, "client/__prerender.json"), "utf-8"),
  );
  configJson.overrides = Object.fromEntries(
    entries.map((e) => [e.html.slice(1), { path: e.route }]),
  );

  // config
  await writeFile(
    join(outDir, "config.json"),
    JSON.stringify(configJson, null, 2),
  );

  // static
  await mkdir(join(outDir, "static"), { recursive: true });
  await cp(join(buildDir, "client"), join(outDir, "static"), {
    recursive: true,
  });

  // function
  await mkdir(join(outDir, "functions/index.func"), { recursive: true });
  await writeFile(
    join(outDir, "functions/index.func/.vc-config.json"),
    JSON.stringify(vcConfigJson, null, 2),
  );

  // bundle function
  await esbuild.build({
    entryPoints: [
      isNodeRuntime
        ? join(import.meta.dirname, "entry-node.js")
        : join(buildDir, "server/index.js"),
    ],
    outfile: join(outDir, "functions/index.func/index.mjs"),
    bundle: true,
    minify: true,
    format: "esm",
    platform: isNodeRuntime ? "node" : "browser",
    define: {
      "process.env.NODE_ENV": `"production"`,
    },
    logOverride: {
      "ignored-bare-import": "silent",
    },
  });
}

main();
