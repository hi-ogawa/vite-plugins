import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { argv } from "process";

const packages = resolve(import.meta.dirname, "..", "..");

const overrides = {
  "@hiogawa/react-server": "file:" + resolve(packages, "react-server"),
  "@hiogawa/transforms": "file:" + resolve(packages, "transforms"),
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
