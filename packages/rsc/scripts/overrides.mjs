import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { argv } from "process";

const packagesDir = resolve(import.meta.dirname, "..", "..");

const overrides = {
  "@hiogawa/transforms": `file:${resolve(packagesDir, "transforms")}`,
  "@hiogawa/vite-rsc": `file:${resolve(packagesDir, "rsc")}`,
};

editJson(argv[2], (pkg) => {
  Object.assign(((pkg.pnpm ??= {}).overrides ??= {}), overrides);
  return pkg;
});

function editJson(filepath, edit) {
  writeFileSync(
    filepath,
    JSON.stringify(edit(JSON.parse(readFileSync(filepath, "utf-8"))), null, 2),
  );
}
