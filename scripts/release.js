import { execSync } from "node:child_process";
import fs from "node:fs";

const $ = (command) => execSync(command, { stdio: "inherit" });

async function main() {
  const [name] = process.argv.slice(2);
  if (!name) {
    console.error("Package name is required");
    process.exitCode = 1;
    return;
  }

  const pkgDir = `packages/${name}`;
  const pkg = JSON.parse(fs.readFileSync(`${pkgDir}/package.json`));
  const pkgTag = `${name}@${pkg.version}`;

  $(`git tag ${pkgTag}`);
  $(`git push origin ${pkgTag}`);
}

main();
