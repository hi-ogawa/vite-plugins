import { memoize, tinyassert } from "@hiogawa/utils";
import type { BundlerConfig, ImportManifestEntry, ModuleMap } from "../types";
import {
  SERVER_DECODE_CLIENT_PREFIX,
  SERVER_REFERENCE_PREFIX,
  createReferenceCacheTag,
  removeReferenceCacheTag,
  setInternalRequire,
} from "./shared";

let init = false;
let requireModule!: (id: string) => unknown;

export function setRequireModule(options: {
  load: (id: string) => unknown;
}): void {
  if (init) return;
  init = true;

  requireModule = (id) => {
    return options.load(removeReferenceCacheTag(id));
  };

  // need memoize to return stable promise from __webpack_require__
  (globalThis as any).__vite_rsc_server_require__ = memoize(requireModule);

  (globalThis as any).__vite_rsc_server_decode_client__ = memoize(
    async (id: string) => {
      // need to restore the client reference proxy module on server
      // TODO: how to do prod?
      // TODO: dev also doesn't feel right.
      id = removeReferenceCacheTag(id);
      return import(/* @vite-ignore */ id);
    },
  );

  setInternalRequire();
}

export async function loadServerAction(id: string): Promise<Function> {
  const [file, name] = id.split("#") as [string, string];
  const mod: any = await requireModule(file);
  return mod[name];
}

export function createServerManifest(): BundlerConfig {
  const cacheTag = import.meta.env.DEV ? createReferenceCacheTag() : "";

  return new Proxy(
    {},
    {
      get(_target, $$id, _receiver) {
        tinyassert(typeof $$id === "string");
        let [id, name] = $$id.split("#");
        tinyassert(id);
        tinyassert(name);
        return {
          id: SERVER_REFERENCE_PREFIX + id + cacheTag,
          name,
          chunks: [],
          async: true,
        } satisfies ImportManifestEntry;
      },
    },
  );
}

export function createServerDecodeClientManifest(): ModuleMap {
  return new Proxy(
    {},
    {
      get(_target, id: string) {
        return new Proxy(
          {},
          {
            get(_target, name: string) {
              return {
                id: SERVER_DECODE_CLIENT_PREFIX + id,
                name,
                chunks: [],
                async: true,
              };
            },
          },
        );
      },
    },
  );
}

export function createClientManifest(): BundlerConfig {
  const cacheTag = import.meta.env.DEV ? createReferenceCacheTag() : "";

  return new Proxy(
    {},
    {
      get(_target, $$id, _receiver) {
        tinyassert(typeof $$id === "string");
        let [id, name] = $$id.split("#");
        tinyassert(id);
        tinyassert(name);
        return {
          id: id + cacheTag,
          name,
          chunks: [],
          async: true,
        } satisfies ImportManifestEntry;
      },
    },
  );
}
