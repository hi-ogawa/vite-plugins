import fs from "node:fs";
import type { LoadHook, ResolveHook } from "node:module";

// support importing ".bin" like CF
// https://developers.cloudflare.com/pages/functions/module-support/#binary-modules

const PROTOCOL = "server-asset-bin:";

export const resolve: ResolveHook = (specifier, context, nextResolve) => {
  if (specifier.endsWith(".bin")) {
    const url = new URL(specifier, context.parentURL);
    if (fs.existsSync(url)) {
      return {
        url: PROTOCOL + url.href,
        shortCircuit: true,
      };
    }
  }
  return nextResolve(specifier, context);
};

export const load: LoadHook = (url, context, nextLoad) => {
  if (url.startsWith(PROTOCOL)) {
    const fileUrl = url.slice(PROTOCOL.length);
    return {
      source: `
        import fs from "node:fs";
        export default fs.readFileSync(new URL(${JSON.stringify(fileUrl)}))
      `,
      shortCircuit: true,
      format: "module",
    };
  }
  return nextLoad(url, context);
};
