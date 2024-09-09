import { handler } from "@hiogawa/react-server/entry/ssr";

export default {
  fetch(request: Request, env: any, _context: any) {
    // expose process.env
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === "string") {
        process.env[k] = v;
      }
    }
    return handler(request);
  },
};
