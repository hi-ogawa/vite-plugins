import * as ReactServer from "@hiogawa/vite-rsc/rsc";
import React from "react";

// based on
// https://github.com/vercel/next.js/pull/70435
// https://github.com/vercel/next.js/blob/09a2167b0a970757606b7f91ff2d470f77f13f8c/packages/next/src/server/use-cache/use-cache-wrapper.ts

export default function cacheWrapper(fn: (...args: any[]) => Promise<unknown>) {
  let store: Record<string, Promise<ReadableStream>> = {};

  async function cachedFn(...args: any[]) {
    if (1) return fn(...args);
    args;
    store;
    ReactServer.renderToReadableStream;
    ReactServer.createFromReadableStream;
  }

  return React.cache(cachedFn);
}
