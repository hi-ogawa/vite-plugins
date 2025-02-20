import { existsSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PrerenderManifest } from "@hiogawa/react-server/plugin";
import FastGlob from "fast-glob";

export async function build({
  outDir,
  publicDir,
}: { outDir: string; publicDir: string }) {
  const buildDir = join(process.cwd(), outDir);
  const adapterOutDir = join(process.cwd(), outDir, "cloudflare");

  // clean
  await rm(adapterOutDir, { recursive: true, force: true });
  await mkdir(adapterOutDir, { recursive: true });

  // assets
  await cp(join(buildDir, "client"), adapterOutDir, {
    recursive: true,
  });

  // worker routes
  // https://developers.cloudflare.com/pages/functions/routing/#create-a-_routesjson-file
  await writeFile(
    join(adapterOutDir, "_routes.json"),
    JSON.stringify(
      {
        version: 1,
        include: ["/*"],
        // TODO: limit rules
        exclude: [
          "/favicon.ico",
          "/assets/*",
          ...(await getPrerenderPaths(buildDir)),
          ...(await FastGlob("**/*", { cwd: publicDir })).map(
            (file) => `/${file}`,
          ),
        ],
      },
      null,
      2,
    ),
  );

  // headers
  // https://developers.cloudflare.com/pages/configuration/headers/
  await writeFile(
    join(adapterOutDir, "_headers"),
    `\
/favicon.ico
  Cache-Control: public, max-age=3600, s-maxage=3600
/assets/*
  Cache-Control: public, max-age=31536000, immutable
`,
  );

  // worker
  // https://developers.cloudflare.com/pages/functions/advanced-mode/
  const esbuild = await import("esbuild");
  const result = await esbuild.build({
    entryPoints: [join(buildDir, "server/index.js")],
    outfile: join(adapterOutDir, "_worker.js"),
    bundle: true,
    minify: true,
    metafile: true,
    format: "esm",
    platform: "browser",
    external: ["node:async_hooks", "node:process"],
    // externalize known module types
    // https://developers.cloudflare.com/pages/functions/module-support
    // https://github.com/cloudflare/workers-sdk/blob/a9b4f252ccbce4856ffc967e51c0aa8cf2e1bb4f/packages/workers-playground/src/QuickEditor/module-collection.ts#L78-L84
    loader: {
      ".wasm": "copy",
      ".bin": "copy",
    },
    define: {
      "process.env.NODE_ENV": `"production"`,
    },
    logOverride: {
      "ignored-bare-import": "silent",
    },
  });
  await writeFile(
    join(buildDir, "esbuild-metafile.json"),
    JSON.stringify(result.metafile),
  );
}

async function getPrerenderPaths(buildDir: string) {
  const file = join(buildDir, "client/__prerender.json");
  if (!existsSync(file)) {
    return [];
  }
  const manifest: PrerenderManifest = JSON.parse(await readFile(file, "utf-8"));
  return manifest.entries.flatMap((e) => [e.route, e.data]);
}

// async function getPublicFilePaths(publicDir: string) {
//   const routeFiles = await FastGlob(
//     path.posix.join(
//       routeDir,
//       "**/(page|layout|error|not-found|loading|template).(js|jsx|ts|tsx|md|mdx)",
//     ),
//   );

//   const files = [];
//   for await (const entry of Deno.readDir(publicDir)) {
//     files.push(entry.name);
//   }
//   return files;
// }
