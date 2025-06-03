import { memoize, tinyassert } from "@hiogawa/utils";
import type { BundlerConfig, ImportManifestEntry, ModuleMap } from "../types";
import {
  SERVER_DECODE_CLIENT_PREFIX,
  SERVER_REFERENCE_PREFIX,
  createReferenceCacheTag,
  removeReferenceCacheTag,
  setInternalRequire,
} from "./shared";

// @ts-ignore
import * as ReactServer from "react-server-dom-webpack/server.edge";

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
    async (raw: string) => {
      // restore client reference on server for decoding.
      // learned from https://github.com/lazarv/react-server/blob/79e7acebc6f4a8c930ad8422e2a4a9fdacfcce9b/packages/react-server/server/module-loader.mjs#L19
      const { id, name } = JSON.parse(raw);
      const reference = ReactServer.registerClientReference(
        () => {
          throw new Error(
            `Unexpectedly client reference export '${name}' is called on server`,
          );
        },
        id,
        name,
      );
      return { [name]: reference };
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
              const payload = JSON.parse(id);
              return {
                id:
                  SERVER_DECODE_CLIENT_PREFIX +
                  JSON.stringify({ id: payload.key || payload.id, name }),
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
  const cacheTag = import.meta.env.DEV ? createReferenceCacheTag() : undefined;

  return new Proxy(
    {},
    {
      get(_target, $$id, _receiver) {
        tinyassert(typeof $$id === "string");
        const [id, name] = $$id.split("#");
        tinyassert(id);
        tinyassert(name);
        return {
          id: JSON.stringify({ id, cacheTag, ...manifest[id] }),
          name,
          chunks: [],
          async: true,
        } satisfies ImportManifestEntry;
      },
    },
  );
}

export type ClientReferencePayload = {
  key: string;
  id: string;
  js: string[];
  css: string[];
};

export type ClientReferenceManifest = Record<string, ClientReferencePayload>;

let manifest: ClientReferenceManifest = {};

export function setClientReferenceManifest(
  manifest_: ClientReferenceManifest,
): void {
  manifest = manifest_;
}
