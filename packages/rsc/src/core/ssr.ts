import { memoize } from "@hiogawa/utils";
import type { ImportManifestEntry, ServerConsumerManifest } from "../types";
import type { ClientReferencePayload } from "./rsc";
import { setInternalRequire } from "./shared";

let init = false;

export function setRequireModule(options: {
  load: (payload: ClientReferencePayload) => unknown;
}): void {
  if (init) return;
  init = true;

  const requireModule = memoize((id: string) => {
    return options.load(JSON.parse(id));
  });

  const clientRequire = (id: string) => {
    return requireModule(id);
  };
  (globalThis as any).__vite_rsc_client_require__ = clientRequire;

  setInternalRequire();
}

export function createServerConsumerManifest(): ServerConsumerManifest {
  return {
    moduleMap: new Proxy(
      {},
      {
        get(_target, id: string, _receiver) {
          return new Proxy(
            {},
            {
              get(_target, name: string) {
                const payload = JSON.parse(id);
                return {
                  id: JSON.stringify({
                    ...payload,
                    ...ssrManifest[payload.key],
                  }),
                  name,
                  chunks: [],
                  async: true,
                } satisfies ImportManifestEntry;
              },
            },
          );
        },
      },
    ),
  };
}

type SsrClientReferenceManifest = Record<string, { id: string }>;

let ssrManifest: SsrClientReferenceManifest = {};

export function setSsrClientReferenceManifest(
  manifest_: SsrClientReferenceManifest,
): void {
  ssrManifest = manifest_;
}
