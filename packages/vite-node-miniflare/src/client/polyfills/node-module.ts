import type nodeModule from "node:module";
import { createUsageChecker } from "./usage-checker";

export const createRequire: typeof nodeModule.createRequire = (url) => {
  return createUsageChecker(`createRequire - ${url}`);
};

export const builtinModules = [];
