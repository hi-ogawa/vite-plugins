// delay worker entry import to setup globals
Object.assign(globalThis, { process: { env: {} } });
const original = await import("./worker-entry");
export default original.default;
