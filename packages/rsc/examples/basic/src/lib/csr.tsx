import { memoize, tinyassert } from "@hiogawa/utils";
import { unwrapRenderId } from "./shared";
import type { WebpackRequire } from "./types";

// __webpack_require__ needs to return stable promise during single render.
// vite uses import with timestamp paramemter during dev,
// so manual invalidation is not necessary (hopefully).
const memeImport = memoize(clientImport);

const csrWebpackRequire: WebpackRequire = (id) => {
  id = unwrapRenderId(id)[0];
  return memeImport(id);
};

async function clientImport(id: string) {
  if (import.meta.env.DEV) {
    // transformed to "?import" which always returns latest module
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

//
// client side navigation
//

import { type RouterHistory, createBrowserHistory } from "@tanstack/history";

export let __history: RouterHistory;

export function initHistory() {
  __history = createBrowserHistory();
}
