import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

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
};

// TODO: vercel edge
const vcConfigJson = {
  runtime: "nodejs20.x",
  handler: "index.mjs",
};

export async function build() {
  const buildDir = join(process.cwd(), "dist");
  const outDir = join(process.cwd(), ".vercel/output");

  // clean
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

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
  const esbuild = await import("esbuild");
  const result = await esbuild.build({
    entryPoints: [join(buildDir, "server/index.js")],
    outfile: join(outDir, "functions/index.func/index.mjs"),
    metafile: true,
    bundle: true,
    minify: true,
    format: "esm",
    platform: "node",
    define: {
      "process.env.NODE_ENV": `"production"`,
    },
    logOverride: {
      "ignored-bare-import": "silent",
    },
  });
  await writeFile(
    join(outDir, "esbuild-metafile.json"),
    JSON.stringify(result.metafile),
  );
}
