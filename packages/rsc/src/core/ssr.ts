import { memoize } from "@hiogawa/utils";
import type { ServerConsumerManifest } from "../types";
import { setInternalRequire } from "./shared";

let init = false;

export function setRequireModule(options: {
  load: (id: string) => unknown;
}): void {
  if (init) return;
  init = true;

  const requireModule = memoize((id: string) => {
    const payload = JSON.parse(id);
    return options.load(payload.id);
  });

  const clientRequire = (id: string) => {
    return requireModule(id);
  };
  (globalThis as any).__vite_rsc_client_require__ = clientRequire;

  setInternalRequire();
}

export function createServerConsumerManifest(): ServerConsumerManifest {
  return {};
}
