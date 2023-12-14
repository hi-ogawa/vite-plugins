// delay worker entry import to patch globals
Object.assign(globalThis, { process: { env: {} } });

export default {
  fetch: async () => {
    try {
      // this virtual module cannot even resolve...?
      // > Failed to load url virtual:remix/server-build (resolved id: virtual:remix/server-build) in /home/hiroshi/code/personal/vite-plugins/packages/vite-node-miniflare/demo-remix/app/worker-entry-wrapper.ts. Does the file exist?
      // await import("virtual:remix/server-build")
      await import("virtual:remix/server-build");

      // @ts-ignore
      // await import("/@id/__x00__virtual:remix/server-build");

      return new Response("ok");
    } catch (e) {
      console.error(e);
      return new Response("error", { status: 500 });
    }
  },
};

// TODO
// const original = await import("./worker-entry");
// export default original.default;
