import { handler } from "@hiogawa/react-server/entry/ssr";
import { storage } from "./runtime-utils";

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
    return storage.run(platform, () => handler(request));
  },
};
