import { once, tinyassert } from "@hiogawa/utils";
import type { WebpackRequire } from "./react-types";

// __webpack_require__ needs to return stable promise during single render.
// during dev, vite uses timestamp, so invalidation is not necessary
const importOnce = once(clientImport);

const csrWebpackRequire: WebpackRequire = (id) => {
  console.log("[__webpack_require__]", { id });
  return importOnce(id);
};

async function clientImport(id: string) {
  if (import.meta.env.DEV) {
    // transformed to `ssrLoadModule` during dev
    return import(/* @vite-ignore */ id);
  } else {
    const clientReferences = await import(
      "/dist/rsc/client-references.js" as string
    );
    const dynImport = clientReferences.default[id];
    tinyassert(dynImport, `client reference not found '${id}'`);
    return dynImport();
  }
}

export function initDomWebpackCsr() {
  Object.assign(globalThis, { __webpack_require__: csrWebpackRequire });
}
