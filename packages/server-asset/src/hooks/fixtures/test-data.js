import { register } from "node:module";
import path from "node:path";

register(path.join(import.meta.dirname, "../data.ts"), import.meta.url);

// @ts-ignore
const mod = await import("./test-data.bin");
console.log(mod.default.toString("utf-8"));
