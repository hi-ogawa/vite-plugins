import type fs from "node:fs";
import { createUsageChecker } from "./usage-checker";

export const existsSync: typeof fs.existsSync = (_path) => {
  // TODO: how does vite-node/client use this?
  // console.log("[existsSync]", _path);
  return false;
};

export const promises = createUsageChecker("node:fs - promises");

export default createUsageChecker("node:fs");
