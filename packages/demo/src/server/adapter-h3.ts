import { defineEventHandler, getRequestIP, toWebRequest } from "h3";
import { createHattipApp } from ".";

// until node 20
if (typeof globalThis.crypto === "undefined") {
  const nodeCrypto = await import("node:crypto");
  (globalThis as any).crypto = nodeCrypto.webcrypto;
}

const hattipHandler = createHattipApp();

const h3Handler = defineEventHandler((event) => {
  return hattipHandler({
    request: toWebRequest(event),
    ip: getRequestIP(event) ?? "127.0.0.1",
    // TODO: h3 context for worker env etc...?
    platform: {},
    passThrough() {},
    // no API to expose `waitUntil`?
    // https://github.com/unjs/h3/issues/73#issuecomment-1131429799
    waitUntil(_promise) {},
  });
});

export default h3Handler;
