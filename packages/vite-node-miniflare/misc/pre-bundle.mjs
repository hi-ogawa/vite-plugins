import path from "node:path";
import fs from "node:fs";
import { parseArgs } from "node:util";
import * as esbuild from "esbuild";

/*

Quick-and-dirty CJS pre-bundling CLI
since `ssr.optimizeDeps` doesn't seem to work when running vite-node client on workered

Usage
  node --conditions browser misc/pre-bundle.mjs react react/jsx-dev-runtime react-dom/server

TODO:
- as cli package?
- as vite plugin (with ssr-only resolve.alias)?

*/

/**
 *
 * @param {string} mod
 */
async function generateCode(mod) {
  const modExports = await import(mod);
  const names = Object.keys(modExports);
  const specifiers = names.join(", ");
  const code = `\
export { ${specifiers} } from "${mod}";
`;
  return code;
}

/**
 *
 * @param {string[]} mods
 * @param {string} srcDir
 * @param {string} outDir
 */
async function setupEntries(mods, srcDir, outDir) {
  /** @type {Record<string, string>} */
  const entries = {};

  for (const mod of mods) {
    const entryCode = await generateCode(mod);
    const entry = path.join(mod, "index.js");
    const entryPath = path.join(srcDir, entry);
    fs.mkdirSync(path.dirname(entryPath), { recursive: true });
    fs.writeFileSync(entryPath, entryCode);
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
  });
}

/**
 *
 * @param {string[]} mods
 * @param {string} outDir
 */
async function preBundle(mods, outDir) {
  const srcDir = path.join(outDir, ".tmp");

  /** @type {Record<string, string>} */
  const entries = {};

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
  });
}

async function main() {
  const args = parseArgs({
    allowPositionals: true,
    options: {
      outDir: {
        type: "string",
        default: "node_modules/.cache/@hiogawa/pre-bundle",
      },
    },
  });
  preBundle(args.positionals, args.values.outDir);
}

main();
