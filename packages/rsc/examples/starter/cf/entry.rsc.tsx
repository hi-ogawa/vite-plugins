import handler from "../src/framework/entry.rsc.base";

export default {
  fetch(request: Request, env: any) {
    return handler(request, (arg) => env.SSR.renderHTML(arg));
  },
};
