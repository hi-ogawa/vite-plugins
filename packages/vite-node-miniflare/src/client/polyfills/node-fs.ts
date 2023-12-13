import type fs from "node:fs";
import { createUsageChecker } from "./usage-checker";

export const existsSync: typeof fs.existsSync = (_path) => {
  // it seems vite-node/client uses this to shortcut resolveId of local file.
  // if that's the only usage, then always returning `false` might be okay.
  // https://github.com/vitest-dev/vitest/blob/9c552b6f8decb78677b20e870eb430184e0b78ea/packages/vite-node/src/client.ts#L227-L229
  console.log("[existsSync]", _path);
  return false;
};

export const promises = createUsageChecker("node:fs - promises");

export default createUsageChecker("node:fs");
