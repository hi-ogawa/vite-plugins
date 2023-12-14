import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import * as esbuild from "esbuild";

// quick-and-dirty CJS pre-bundling CLI
// since `ssr.optimizeDeps` doesn't seem to work when running vite-node client on workered

async function generateCode(mod: string) {
  // execute external process to add `--conditions` explicitly?
  const modExports = await import(mod);
  const names = Object.keys(modExports);
  const code = `\
export { ${names.join(", ")} } from "${mod}";
`;
  return code;
}

async function preBundle(mods: string[], outDir: string) {
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
