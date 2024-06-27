#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const viteBin = path.join(
  require.resolve("vite/package.json"),
  "../bin/vite.js",
);

const argv = process.argv.slice(2);

// TODO: init command for
// npx @hiogawa/react-server-next init
// - create vite.config.ts
// - add "type": "module"
// - add dep alias
if (argv[0] === "init") {
  process.exit(0);
}

if (!["dev", "build", "start"].includes(argv[0])) {
  console.error(`[ERROR] unsupported command '${argv[0]}'`);
  process.exit(1);
}

// next start -> vite preview
if (argv[0] === "start") {
  argv[0] = "preview";
}

// auto setup vite.config.ts
if (!existsSync("vite.config.ts")) {
  writeFileSync(
    "vite.config.ts",
    `\
import next from "next/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [next()],
});
`,
  );
}

spawn("node", [viteBin, ...argv], {
  shell: false,
  stdio: "inherit",
});
