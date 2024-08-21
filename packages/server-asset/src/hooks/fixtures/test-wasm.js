// @ts-nocheck

import { register } from "node:module";
import path from "node:path";

register(path.join(import.meta.dirname, "../wasm.ts"), import.meta.url);

const mod = await import("./test-wasm.wasm");
const instance = await WebAssembly.instantiate(mod.default);
console.log(instance.exports.addTwo(1, 2));

/*

copied from https://webassembly.github.io/wabt/demo/wat2wasm/

// .wat
(module
  (func (export "addTwo") (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.add))

// .wasm
echo -n 'AGFzbQEAAAABBwFgAn9/AX8DAgEABwoBBmFkZFR3bwAACgkBBwAgACABagsACgRuYW1lAgMBAAA=' | base64 -d > packages/server-asset/src/hooks/fixtures/test-wasm.wasm

*/
