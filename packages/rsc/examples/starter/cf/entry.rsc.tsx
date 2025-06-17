import handler from "../src/framework/entry.rsc.base";

export default {
  fetch(request: Request, env: any) {
    // if (import.meta.env.DEV) {
    //   (globalThis as any).__viteSsrRunner = {
    //     import: async () => {
    //       return {
    //         renderHTML: (...args: any[]) => env.SSR.renderHTML(...args),
    //       };
    //     },
    //   };
    // }
    // const loadSsrModule = import.meta.env.DEV
    return handler(request, (arg) => env.SSR.renderHTML(arg));
  },
};
