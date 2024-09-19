import { AsyncLocalStorage } from "node:async_hooks";
import { handler } from "@hiogawa/react-server/entry/ssr";
import { $cloudflare } from "./global";

$cloudflare.storage = new AsyncLocalStorage();

export default {
  fetch(request: Request, env: any, ctx: any) {
    // expose process.env
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === "string") {
        process.env[k] = v;
      }
    }
    const platform = {
      env,
      ctx,
      cf: (request as any).cf,
      caches,
    };
    return $cloudflare.storage.run(platform, () => handler(request));
  },
};
