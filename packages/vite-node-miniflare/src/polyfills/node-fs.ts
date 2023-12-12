import { createUsageChecker } from "./usage-checker";

export const existsSync = () => {
  return false;
};

export const promises = createUsageChecker("node:fs - promises");

export default createUsageChecker("node:fs");
