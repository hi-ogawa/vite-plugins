import { tinyassert } from "@hiogawa/utils";
import type { WebpackRequire } from "./react-types";

// weird trick to make stable import promise during SSR
// https://github.com/facebook/react/pull/26926#discussion_r1236251023
// https://github.com/facebook/react/pull/26985
interface StablePromise<T> extends PromiseLike<T> {
  update: (next: Promise<T>) => void;
}

function createStablePromise<T>(initial: Promise<T>): StablePromise<T> {
  let promise = initial;
  return {
    update: (next: Promise<T>) => {
      promise = next;
    },
    then: (onfulfilled, onrejected) => {
      return promise.then(onfulfilled, onrejected);
    },
  };
}

const importCache = new Map<string, StablePromise<unknown>>();

// synchronously return stable promise(like)
const ssrWebpackRequire: WebpackRequire = (id) => {
  console.log("[__webpack_require__]", { id });
  const modPromise = ssrImport(/* @vite-ignore */ id);
  let stablePromise = importCache.get(id);
  if (stablePromise) {
    stablePromise.update(modPromise);
  } else {
    stablePromise = createStablePromise(modPromise);
    importCache.set(id, stablePromise);
  }
  return stablePromise;
};

async function ssrImport(id: string): Promise<unknown> {
  if (import.meta.env.DEV) {
    return import(/* @vite-ignore */ id);
  } else {
    // `as string` to silence ts error
    const clientReferences = await import(
      "/dist/rsc/client-references.js" as string
    );
    const dynImport = clientReferences[id];
    tinyassert(dynImport, `client reference not found '${id}'`);
    return dynImport();
  }
}

export function initDomWebpackSsr() {
  Object.assign(globalThis, { __webpack_require__: ssrWebpackRequire });
}
