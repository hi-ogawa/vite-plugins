import { DefaultMap, memoize, tinyassert } from "@hiogawa/utils";
import type { ImportManifestEntry, ModuleMap, WebpackRequire } from "./types";

// __webpack_require__ is called at least twice for preloadModule and requireModule
// https://github.com/facebook/react/blob/706d95f486fbdec35b771ea4aaf3e78feb907249/packages/react-server-dom-webpack/src/ReactFlightClientConfigBundlerWebpack.js

// during dev, import cache needs to be isolated for each SSR run
// so that import/ssrLoadModule will load fresh module while keeping Promise stable
//   https://github.com/facebook/react/pull/26985
//   https://github.com/facebook/react/pull/26926#discussion_r1236251023
//
// Alternative:
//   use AsyncLocalStorage to differentiate each run.
//   however it's not supported well on Stackblitz, so we avoid relying on it for now.
//
const memoImportByRenderId = new DefaultMap<string, WebpackRequire>(() =>
  // `import` is transformed to `ssrLoadModule` during dev
  memoize((id) => import(/* @vite-ignore */ id))
);

// cleanup importCache after render to avoid leaking memory during dev
export function invalidateImportCacheOnFinish<T>(renderId: string) {
  return new TransformStream<T, T>({
    flush() {
      if (import.meta.env.DEV) {
        memoImportByRenderId.delete(renderId);
      }
    },
  });
}

async function createWebpackRequire(): Promise<WebpackRequire> {
  if (import.meta.env.DEV) {
    return (id) => {
      const [file, renderId] = id.split(RENDER_ID_SEP) as [string, string];
      return memoImportByRenderId.get(renderId)(file);
    };
  } else {
    // `as string` to silence ts error
    const clientReferences = await import(
      "/dist/rsc/client-references.js" as string
    );
    return memoize((id) => {
      const dynImport = clientReferences.default[id];
      tinyassert(dynImport, `client reference not found '${id}'`);
      return dynImport();
    });
  }
}

export async function initDomWebpackSsr() {
  Object.assign(globalThis, {
    __webpack_require__: await createWebpackRequire(),
    __webpack_chunk_load__: () => {
      throw new Error("todo: __webpack_chunk_load__");
    },
  });
}

export function createModuleMap({ renderId }: { renderId: string }): ModuleMap {
  return new Proxy(
    {},
    {
      get(_target, id, _receiver) {
        return new Proxy(
          {},
          {
            get(_target, name, _receiver) {
              tinyassert(typeof id === "string");
              tinyassert(typeof name === "string");
              if (import.meta.env.DEV) {
                id = [id, renderId].join(RENDER_ID_SEP);
              }
              return {
                id,
                name,
                chunks: [],
              } satisfies ImportManifestEntry;
            },
          }
        );
      },
    }
  );
}

const RENDER_ID_SEP = "*";
