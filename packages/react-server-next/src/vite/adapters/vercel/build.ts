import { existsSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PrerenderManifest } from "@hiogawa/react-server/plugin";
import { bundleEdge } from "../shared";

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

// edge only for now
const vcConfigJson = {
  runtime: "edge",
  entrypoint: "index.js",
};

export async function build() {
  const buildDir = join(process.cwd(), "dist");
  const outDir = join(process.cwd(), ".vercel/output");

  // clean
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  // overrides for ssg html
  // https://vercel.com/docs/build-output-api/v3/configuration#overrides
  const prerenderManifest = await getPrerenderManifest(buildDir);
  if (prerenderManifest) {
    configJson.overrides = Object.fromEntries(
      prerenderManifest.entries.map((e) => [
        e.html.slice(1),
        { path: e.route },
      ]),
    );
  }

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

  // function config
  await mkdir(join(outDir, "functions/index.func"), { recursive: true });
  await writeFile(
    join(outDir, "functions/index.func/.vc-config.json"),
    JSON.stringify(vcConfigJson, null, 2),
  );

  // bundle function
  await bundleEdge(buildDir, {
    entryPoints: [join(buildDir, "server/index.js")],
    outfile: join(outDir, "functions/index.func/index.js"),
  });
}

async function getPrerenderManifest(buildDir: string) {
  const file = join(buildDir, "client/__prerender.json");
  if (!existsSync(file)) {
    return;
  }
  return JSON.parse(await readFile(file, "utf-8")) as PrerenderManifest;
}
