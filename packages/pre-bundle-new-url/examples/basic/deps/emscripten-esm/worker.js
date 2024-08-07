import Module from "./lib/build-esm.js";

let lib;

self.onmessage = async () => {
  lib ??= await Module();
  self.postMessage(lib.hello("world"));
};
