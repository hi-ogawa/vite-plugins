import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { createManualPromise } from "@hiogawa/utils";

// quick-and-dirty CJS pre-bundling
// since `ssr.optimizeDeps` doesn't seem to work when running vite-node client on workered

async function extractExports(mod: string): Promise<string[]> {
  const evalCode = `console.log(JSON.stringify(Object.keys(await import("${mod}"))))`;
  const promise = createManualPromise<void>();
  const proc = childProcess.spawn(
    "node",
    ["--conditions", "browser", "--input-type", "module", "-e", evalCode],
    {
      stdio: ["ignore", "pipe", "inherit"],
    }
  );
  let stdout = "";
  proc.stdout.on("data", (data) => {
    stdout += data.toString();
  });
  proc.on("exit", () => {
    promise.resolve();
  });
  await promise;
  if (proc.exitCode !== 0) {
    throw new Error(`Failed to run 'import("${mod}")'`);
  }
  const names: string[] = JSON.parse(stdout);
  return names;
}

async function generateCode(mod: string) {
  const names = await extractExports(mod);
  return `export { ${names.join(", ")} } from "${mod}"\n`;
}

async function preBundle(mods: string[], outDir: string) {
  const esbuild = await import("esbuild");

  const srcDir = path.join(outDir, ".tmp");

  const entries: Record<string, string> = {};

  for (const mod of mods) {
    const entryCode = await generateCode(mod);
    const entry = path.join(mod, "index.js");
    const entryPath = path.join(srcDir, entry);
    await fs.promises.mkdir(path.dirname(entryPath), { recursive: true });
    await fs.promises.writeFile(entryPath, entryCode);
    entries[entry] = entryPath;
  }

  await esbuild.build({
    entryPoints: entries,
    format: "esm",
    platform: "browser",
    conditions: ["browser"],
    bundle: true,
    splitting: true,
    outdir: outDir,
    tsconfigRaw: {},
    logLevel: "info",
  });
}

async function main() {
  const args = parseArgs({
    allowPositionals: true,
    options: {
      outDir: {
        type: "string",
        default: "node_modules/.cache/@hiogawa/vite-node-miniflare/pre-bundle",
      },
    },
  });
  await preBundle(args.positionals, args.values.outDir!);
}

main();
