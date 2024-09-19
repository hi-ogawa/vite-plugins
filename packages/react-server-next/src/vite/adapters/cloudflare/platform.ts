import { $cloudflare } from "./global";

export function getPlatform() {
  if (import.meta.env.DEV) {
    return $cloudflare.platformProxy;
  } else {
    return $cloudflare.storage.getStore();
  }
}
