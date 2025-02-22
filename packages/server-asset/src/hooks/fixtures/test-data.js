// @ts-nocheck

const mod = await import("./test-data.bin");
console.log(mod.default.toString("utf-8"));
