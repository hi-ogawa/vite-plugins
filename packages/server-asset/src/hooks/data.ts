import fs from "node:fs";
import type { LoadHook, ResolveHook } from "node:module";
import { fileURLToPath } from "node:url";

// support importing ".bin" like CF
// https://developers.cloudflare.com/pages/functions/module-support/#binary-modules

const PROTOCOL = "server-asset-bin:";

export const resolve: ResolveHook = (specifier, context, nextResolve) => {
  if (specifier.endsWith(".bin")) {
    const url = new URL(specifier, context.parentURL);
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
    const fileUrl = url.slice(PROTOCOL.length);
    const filePath = fileURLToPath(new URL(fileUrl));
    return {
      source: `
        import fs from "node:fs";
        export default fs.readFileSync(${JSON.stringify(filePath)});
      `,
      format: "module",
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
};
