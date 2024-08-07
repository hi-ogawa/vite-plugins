import Module from "./lib/lib.js";

let lib;

self.onmessage = async () => {
  lib ??= await Module();
  self.postMessage(lib.hello("world"));
};
