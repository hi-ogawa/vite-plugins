import type { PlatformProxy } from "wrangler";
import { $cloudflare } from "./global";

export function getPlatform<Env>(): PlatformProxy<Env> {
  if (import.meta.env.DEV) {
    return $cloudflare.platformProxy;
  } else {
    return $cloudflare.storage.getStore();
  }
}
