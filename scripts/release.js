// Example usage:
//   node scripts/release.js nitro

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const $ = (command) => execSync(command, { stdio: "inherit" });

async function main() {
  const [pkgDir] = process.argv.slice(2);
  if (!pkgDir) {
    console.error("Package directory input is required");
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(pkgDir)) {
    console.error(`Package directory "${pkgDir}" doesn't exist`);
    process.exitCode = 1;
    return;
  }
  const pkg = JSON.parse(fs.readFileSync(`${pkgDir}/package.json`));
  const name = path.basename(pkgDir);
  const pkgTag = `${name}@${pkg.version}`;

  $(`git tag ${pkgTag}`);
  $(`git push origin ${pkgTag}`);
}

main();
