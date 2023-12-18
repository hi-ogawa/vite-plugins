declare module "react-dom/server.browser" {
  export * from "react-dom/server";
}

declare module "virtual:remix/server-build" {
  export * from "@remix-run/dev/server-build";
}

// quick-and-dirty globalThis.env exposed in fetch handler
declare const env: {
  kv: import("@cloudflare/workers-types").KVNamespace;
};
