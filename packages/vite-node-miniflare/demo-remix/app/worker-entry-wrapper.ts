// delay worker entry import to patch globals
Object.assign(globalThis, { process: { env: {} } });

export default {
  fetch: async () => {
    try {
      const build = await import("virtual:remix/server-build");
      console.log("@@@");
      console.log(build);

      return new Response("ok");
    } catch (e) {
      console.error("@@@");
      console.error(e);
      return new Response("error", { status: 500 });
    }
  },
};

// TODO
// const original = await import("./worker-entry");
// export default original.default;
