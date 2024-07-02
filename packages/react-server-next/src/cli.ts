import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

function main() {
  const argv = process.argv.slice(2);

  // TODO: init command?
  // argv[0] === "init";

  if (argv[0] && !["dev", "build", "start"].includes(argv[0])) {
    console.error(`[ERROR] unsupported command '${argv[0]}'`);
    process.exit(1);
  }

  // next start -> vite preview
  if (argv[0] === "start") {
    argv[0] = "preview";
  }

  // auto setup vite.config.ts
  setupViteConfig();

  // spawn vite
  const viteBin = path.join(
    createRequire(import.meta.url).resolve("vite/package.json"),
    "../bin/vite.js",
  );
  const proc = spawn("node", [viteBin, ...argv], {
    shell: false,
    stdio: "inherit",
  });
  proc.on("close", (code) => {
    process.exitCode = code ?? 1;
  });
}

function setupViteConfig() {
  const DEFAULT_VITE_CONFIG = `\
import next from "next/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [next()],
});
`;

  if (!existsSync("vite.config.ts") && !existsSync("vite.config.mts")) {
    const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
    const configFile =
      pkg.type === "module" ? "vite.config.ts" : "vite.config.mts";
    console.log(`:: Created ${configFile}`);
    writeFileSync(configFile, DEFAULT_VITE_CONFIG);
  }
}

main();
