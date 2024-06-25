#!/usr/bin/env node
import { spawn } from "node:child_process";
import process from "node:process";

const argv = process.argv.slice(2);

if (argv[2] === "init") {
  // TODO: initial command to setup vite
  // - update package.json
  // - add vite.config.ts
}

if (argv[2] === "start") {
  argv[2] = "preview";
}

// TODO
spawn;
