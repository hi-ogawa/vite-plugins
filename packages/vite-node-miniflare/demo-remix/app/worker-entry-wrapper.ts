// delay worker entry import to patch globals
Object.assign(globalThis, { process: { env: {} } });

export default {
  fetch: async () => {
    try {
      // this virtual module cannot even resolve...?
      // await import("virtual:remix/server-build")

      // @ts-ignore
      await import("/@id/__x00__virtual:remix/server-build");

      return new Response("ok");
    } catch (e) {
      console.error("@@@@");
      console.error(e);
      console.error("@@@@");
      return new Response("error");
    }
  },
};

// TODO
// const original = await import("./worker-entry");
// export default original.default;
