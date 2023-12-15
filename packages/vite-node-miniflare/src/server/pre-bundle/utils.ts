import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createManualPromise, wrapError } from "@hiogawa/utils";

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

async function generateEntryCode(mod: string) {
  const names = await extractExports(mod);
  return `export { ${names.join(", ")} } from "${mod}"\n`;
}

export class PreBundler {
  entries: Record<string, { in: string; out: string }> = {};
  alias: Record<string, string> = {};
  hashValue: string;
  hashPath: string;

  constructor(public mods: string[], public outDir: string) {
    this.hashValue = JSON.stringify(mods);
    this.hashPath = path.join(outDir, ".hash");

    for (const mod of mods) {
      this.entries[mod] = {
        in: path.join(outDir, ".src", path.join(mod, "index.js")),
        out: path.join(outDir, path.join(mod, "index")), // esbuild's need extension stripped
      };
      this.alias[mod] = path.join(outDir, path.join(mod, "index.js"));
    }
  }

  isCached(): boolean {
    const result = wrapError(
      () =>
        fs.existsSync(this.hashPath) &&
        fs.readFileSync(this.hashPath, "utf-8") === this.hashValue
    );
    return result.ok && result.value;
  }

  async run() {
    const esbuild = await import("esbuild");

    // extract cjs module exports and generate source file to re-export as ESM
    for (const [mod, entry] of Object.entries(this.entries)) {
      const entryCode = await generateEntryCode(mod);
      await fs.promises.mkdir(path.dirname(entry.in), { recursive: true });
      await fs.promises.writeFile(entry.in, entryCode);
    }

    // bundle with code splitting
    const result = await esbuild.build({
      entryPoints: Object.values(this.entries),
      format: "esm",
      platform: "browser",
      conditions: ["browser"],
      bundle: true,
      splitting: true,
      outdir: this.outDir,
      logLevel: "info",
      tsconfigRaw: {},
    });

    // save bundle hash
    await fs.promises.writeFile(this.hashPath, this.hashValue);

    return result;
  }
}
