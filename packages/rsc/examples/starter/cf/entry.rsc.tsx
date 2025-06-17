import handler from "../src/framework/entry.rsc";

export default {
  fetch(request: Request, env: any) {
    return handler(request, () => env.SSR);
  },
};
