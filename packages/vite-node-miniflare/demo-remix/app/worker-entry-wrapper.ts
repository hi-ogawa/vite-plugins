// delay worker entry import to patch globals
Object.assign(globalThis, { process: { env: {} } });

const original = await import("./worker-entry");
export default original.default;
