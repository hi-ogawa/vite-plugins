import fs from "node:fs";
import type { LoadHook, ResolveHook } from "node:module";
import { fileURLToPath } from "node:url";

// support importing ".wasm?module" like CF
// https://developers.cloudflare.com/pages/functions/module-support/#webassembly-modules

const PROTOCOL = "server-asset-wasm:";

export const resolve: ResolveHook = (specifier, context, nextResolve) => {
  if (specifier.endsWith(".wasm?module")) {
    const url = new URL(specifier, context.parentURL);
    url.search = "";
    if (fs.existsSync(url)) {
      return {
        url: PROTOCOL + url.href,
        format: "module",
        shortCircuit: true,
      };
    }
  }
  return nextResolve(specifier, context);
};

export const load: LoadHook = (url, context, nextLoad) => {
  if (url.startsWith(PROTOCOL)) {
    const filePath = fileURLToPath(new URL(url.slice(PROTOCOL.length)));
    const source = `\
import fs from "node:fs";
export default new WebAssembly.Module(fs.readFileSync(${JSON.stringify(filePath)}));
`;
    return {
      source,
      format: "module",
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
};
