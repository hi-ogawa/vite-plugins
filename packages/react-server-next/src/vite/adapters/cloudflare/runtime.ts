import type { PlatformProxy } from "wrangler";
import { storage } from "./runtime-utils";

export function getPlatform<Env>(): PlatformProxy<Env> {
  if (import.meta.env.DEV) {
    return (globalThis as any).__reactServerCloudflarePlatform;
  } else {
    return storage.getStore() as any;
  }
}
