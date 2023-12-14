import { createUsageChecker } from "./usage-checker";

// TODO don't have to polyfill?
// https://developers.cloudflare.com/workers/runtime-apis/nodejs/path/

export { dirname } from "pathe";
export default createUsageChecker("node:path");
