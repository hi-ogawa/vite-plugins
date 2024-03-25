import { memoize, tinyassert } from "@hiogawa/utils";
import type { WebpackRequire } from "./types";

// __webpack_require__ needs to return stable promise during single render.
//   https://github.com/facebook/react/pull/26985
//   https://github.com/facebook/react/pull/26926#discussion_r1236251023
// vite uses import with timestamp paramemter during dev,
// so manual invalidation doesn't look necessary for client?
const csrWebpackRequire: WebpackRequire = memoize(clientImport);

async function clientImport(id: string) {
  if (import.meta.env.DEV) {
    // transformed to "?import"
    return import(/* @vite-ignore */ id);
  } else {
    // TODO: avoid extra round trip for this dynamic import
    const clientReferences = await import(
      "/dist/rsc/client-references.js" as string
    );
    const dynImport = clientReferences.default[id];
    tinyassert(dynImport, `client reference not found '${id}'`);
    return dynImport();
  }
}

export function initDomWebpackCsr() {
  Object.assign(globalThis, {
    __webpack_require__: csrWebpackRequire,
    __webpack_chunk_load__: () => {
      throw new Error("todo: __webpack_chunk_load__");
    },
  });
}
