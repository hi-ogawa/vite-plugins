import { existsSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PrerenderManifest } from "@hiogawa/react-server/plugin";

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

const vcConfig = {
  edge: {
    runtime: "edge",
    entrypoint: "index.mjs",
  },
  node: {
    runtime: "nodejs20.x",
    handler: "index.mjs",
    launcherType: "Nodejs",
  },
} satisfies Record<VercelRuntime, object>;

type VercelRuntime = "node" | "edge";

export async function build({
  runtime,
  outDir,
}: {
  runtime: VercelRuntime;
  outDir: string;
}) {
  const buildDir = join(process.cwd(), outDir);
  const adapterOutDir = join(process.cwd(), ".vercel/output");

  // clean
  await rm(adapterOutDir, { recursive: true, force: true });
  await mkdir(adapterOutDir, { recursive: true });

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

  // `overrides` seems broken for root path, so add rewrite manually
  if ("index.html" in configJson.overrides) {
    delete configJson.overrides["index.html"];
    configJson.routes.splice(1, 0, {
      src: "^/$",
      dest: "/index.html",
    });
  }

  // config
  await writeFile(
    join(adapterOutDir, "config.json"),
    JSON.stringify(configJson, null, 2),
  );

  // static
  await mkdir(join(adapterOutDir, "static"), { recursive: true });
  await cp(join(buildDir, "client"), join(adapterOutDir, "static"), {
    recursive: true,
  });

  // function config
  await mkdir(join(adapterOutDir, "functions/index.func"), { recursive: true });
  await writeFile(
    join(adapterOutDir, "functions/index.func/.vc-config.json"),
    JSON.stringify(vcConfig[runtime], null, 2),
  );

  // bundle function
  const esbuild = await import("esbuild");
  const result = await esbuild.build({
    entryPoints: [join(buildDir, "server/index.js")],
    outfile: join(adapterOutDir, "functions/index.func/index.mjs"),
    metafile: true,
    bundle: true,
    minify: true,
    format: "esm",
    platform: runtime === "node" ? "node" : "browser",
    external: ["node:async_hooks"],
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

async function getPrerenderManifest(buildDir: string) {
  const file = join(buildDir, "client/__prerender.json");
  if (!existsSync(file)) {
    return;
  }
  return JSON.parse(await readFile(file, "utf-8")) as PrerenderManifest;
}
