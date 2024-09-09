import { handler } from "@hiogawa/react-server/entry/ssr";

export default {
  fetch(request: Request, env: any) {
    // copy cf binding variable to process.env
    for (const [k, v] of Object.entries(env)) {
      if (typeof v === "string") {
        process.env[k] = v;
      }
    }
    return handler(request);
  },
};
