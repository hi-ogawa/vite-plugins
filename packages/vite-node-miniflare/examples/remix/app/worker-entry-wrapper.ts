// patch a few things before running worker entry
Object.assign(globalThis, { process: { env: {} } });

const original = await import("./worker-entry");
export default original.default;
