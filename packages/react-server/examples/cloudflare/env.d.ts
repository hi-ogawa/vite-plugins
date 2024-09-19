import type { PlatformProxy } from "wrangler";

declare module "next/vite/platform" {
  interface Platform extends PlatformProxy<Env> {}
}
