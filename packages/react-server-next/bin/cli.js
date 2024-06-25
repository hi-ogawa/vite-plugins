#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
const viteBin = path.join(
  require.resolve("vite/package.json"),
  "../bin/vite.js",
);

const argv = process.argv.slice(2);

if (!["dev", "build", "start"].includes(argv[0])) {
  console.error(`[ERROR] unsupported command '${argv[0]}'`);
  process.exit(1);
}

// next start -> vite preview
if (argv[0] === "start") {
  argv[0] = "preview";
}

spawn("node", [viteBin, ...argv], {
  shell: false,
  stdio: "inherit",
});
