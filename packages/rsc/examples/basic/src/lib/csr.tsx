import { memoize, tinyassert } from "@hiogawa/utils";
import type { WebpackRequire } from "./types";

// __webpack_require__ needs to return stable promise during single render.
// vite uses import with timestamp paramemter during dev,
// so invalidation is not necessary (hopefully).
const importOnce = memoize(clientImport);

const csrWebpackRequire: WebpackRequire = (id) => {
  console.log("[__webpack_require__]", { id });
  return importOnce(id);
};

async function clientImport(id: string) {
  if (import.meta.env.DEV) {
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
