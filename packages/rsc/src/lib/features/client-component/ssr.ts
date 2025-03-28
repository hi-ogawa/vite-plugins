import { memoize, tinyassert } from "@hiogawa/utils";
import type { ImportManifestEntry, ModuleMap } from "../../types";

// In contrast to old dev ssr, new module runner's dynamic `import`
// with `vite-ignore` joins in a module graph.
// Thus, `invalidateDepTree` by `vitePluginReactServer` will invalidate
// this entire module and `momoize` will get refreshed automatically.
// So, we don't have to manage `ssrImportPromiseCache` like done in
// https://github.com/hi-ogawa/vite-plugins/blob/1c12519065563da60de9f58b946695adcbb50924/packages/react-server/src/features/use-client/server.tsx#L10-L18

async function importClientReference(id: string) {
  if (import.meta.env.DEV) {
    return import(/* @vite-ignore */ id);
  } else {
    const clientReferences = await import(
      "virtual:client-references" as string
    );
    const dynImport = clientReferences.default[id];
    tinyassert(dynImport, `client reference not found '${id}'`);
    return dynImport();
  }
}

export function initializeReactClientSsr(): void {
  Object.assign(globalThis, {
    __webpack_require__: memoize(importClientReference),
    __webpack_chunk_load__: () => {
      throw new Error("todo: __webpack_chunk_load__");
    },
  });
}

export function createModuleMap(): ModuleMap {
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
              return {
                id,
                name,
                chunks: [],
              } satisfies ImportManifestEntry;
            },
          },
        );
      },
    },
  );
}
