import { memoize } from "@hiogawa/utils";
import type { ClientReferencePayload } from "./rsc";
import { setInternalRequire } from "./shared";

let init = false;

export function setRequireModule(options: {
  load: (payload: ClientReferencePayload) => Promise<unknown>;
}): void {
  if (init) return;
  init = true;

  const requireModule = memoize((id: string) => {
    return options.load(JSON.parse(id));
  });

  (globalThis as any).__vite_rsc_client_require__ = requireModule;

  setInternalRequire();
}
