import type { PlatformProxy } from "wrangler";

export function getPlatform<Env>(): PlatformProxy<Env> {
  if (import.meta.env.DEV) {
    return (globalThis as any).__reactServerCloudflarePlatform;
  } else {
    return (globalThis as any).__reactServerCloudflareStorage.getStore();
  }
}
