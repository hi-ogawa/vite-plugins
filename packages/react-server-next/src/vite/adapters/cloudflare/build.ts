import { existsSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PrerenderManifest } from "@hiogawa/react-server/plugin";
import { bundleEdge } from "../shared";

export async function build() {
  const buildDir = join(process.cwd(), "dist");
  const outDir = join(process.cwd(), "dist/cloudflare");

  // clean
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  // assets
  await cp(join(buildDir, "client"), outDir, {
    recursive: true,
  });

  // worker routes
  // https://developers.cloudflare.com/pages/functions/routing/#create-a-_routesjson-file
  await writeFile(
    join(outDir, "_routes.json"),
    JSON.stringify(
      {
        version: 1,
        include: ["/*"],
        // TODO: limit rules
        exclude: [
          "/favicon.ico",
          "/assets/*",
          ...(await getPrerenderPaths(buildDir)),
        ],
      },
      null,
      2,
    ),
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
  await bundleEdge(buildDir, {
    entryPoints: [join(buildDir, "server/index.js")],
    outfile: join(outDir, "_worker.js"),
  });
}

async function getPrerenderPaths(buildDir: string) {
  const file = join(buildDir, "client/__prerender.json");
  if (!existsSync(file)) {
    return [];
  }
  const manifest: PrerenderManifest = JSON.parse(await readFile(file, "utf-8"));
  return manifest.entries.flatMap((e) => [e.route, e.data]);
}
