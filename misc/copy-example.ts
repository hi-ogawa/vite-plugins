import { exec } from "node:child_process";
import fs from "node:fs";
import process from "node:process";
import { promisify } from "node:util";
import { tinyassert, zip } from "@hiogawa/utils";

// usage
//   node -r esbuild-register misc/copy-example.ts --name ssr

async function main() {
  const name = readFlag("--name");
  tinyassert(name, "'--name' required");

  const dstDir = readFlag("--dstDir") ?? `dist/examples/${name}`;
  const srcDir = `examples/${name}`;

  // copy directory
  await $`rm -rf ${dstDir}`;
  await $`mkdir -p ${dstDir}`;
  await $`cp -r ${srcDir}/. ${dstDir}`;
  await $`rm -rf ${dstDir}/dist ${dstDir}/node_modules ${dstDir}/tsconfig.json`;

  // update "workspace:*" versions
  await rewriteFile(`${dstDir}/package.json`, (content) =>
    content.replace(/workspace:\*/g, "*")
  );
}

//
// utils
//

const execPromise = promisify(exec);

async function $(strings: TemplateStringsArray, ...values: unknown[]) {
  const command = [zip(strings, values), strings.at(-1)].flat(2).join("");
  console.log("$ " + command);
  const result = await execPromise(command);
  if (result.stderr) {
    console.error(result.stderr);
  }
  return result.stdout;
}

function readFlag(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i >= 0) {
    return process.argv[i + 1];
  }
}

async function rewriteFile(
  filepath: string,
  rewrite: (content: string) => string
): Promise<void> {
  const v = await fs.promises.readFile(filepath, "utf-8");
  await fs.promises.writeFile(filepath, rewrite(v));
}

main();
