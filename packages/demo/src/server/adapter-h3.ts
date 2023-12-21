import { defineEventHandler, getRequestIP, toWebRequest } from "h3";
import { createHattipApp } from ".";

// TODO: node 20
if (typeof globalThis.crypto === "undefined") {
  const nodeCrypto = await import("node:crypto");
  (globalThis as any).crypto = nodeCrypto.webcrypto;
}

const hattipHandler = createHattipApp();

const h3Handler = defineEventHandler((event) => {
  event.context;
  return hattipHandler({
    request: toWebRequest(event),
    ip: getRequestIP(event) ?? "127.0.0.1",
    // https://github.com/unjs/nitro/blob/5ead36f78eb54ab94b01c48f6da6e0ecf20a79fa/src/runtime/entries/cloudflare-module.ts#L59-L63
    platform: event.context,
    passThrough() {},
    waitUntil(_promise) {
      // TODO: preset dependent e.g.
      event.context["cloudflare"];
      event.context["vercel"];
    },
  });
});

export default h3Handler;
