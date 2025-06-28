import * as ReactRsc from "@hiogawa/vite-rsc/rsc";
import React from "react";

// based on
// https://github.com/vercel/next.js/pull/70435
// https://github.com/vercel/next.js/blob/09a2167b0a970757606b7f91ff2d470f77f13f8c/packages/next/src/server/use-cache/use-cache-wrapper.ts

export default function cacheWrapper(fn: (...args: any[]) => Promise<unknown>) {
  const cacheEntries: Record<string, Promise<StreamCacher>> = {};

  async function cachedFn(...args: any[]) {
    // serialize arguments to a cache key via `encodeReply` from `react-server-dom/client`
    // TODO: why not use `renderToReadableStream` to serialize instead?
    const clientTemporaryReferences =
      ReactRsc.createClientTemporaryReferenceSet();
    const encodedArguments = await ReactRsc.encodeReply(args, {
      temporaryReferences: clientTemporaryReferences,
    });
    const serializedCacheKey =
      typeof encodedArguments === "string"
        ? "a:" + encodedArguments
        : "b:" +
          arrayBufferToString(
            await new Response(encodedArguments).arrayBuffer(),
          );

    // cache `fn` result as stream
    const entryPromise = (cacheEntries[serializedCacheKey] ??= (async () => {
      // TODO: why not use `args` directly?
      const temporaryReferences = ReactRsc.createTemporaryReferenceSet();
      const decodedArgs = await ReactRsc.decodeReply(encodedArguments, {
        temporaryReferences,
      });

      // run the original function
      const result = await fn(...decodedArgs);

      // serialize result to a ReadableStream
      const stream = ReactRsc.renderToReadableStream(result, {
        environmentName: "Cache",
        temporaryReferences,
      });
      return new StreamCacher(stream);
    })());

    // deserialized cached stream
    const stream = (await entryPromise).get();
    const result = ReactRsc.createFromReadableStream(stream, {
      environmentName: "Cache",
      replayConsoleLogs: true,
      temporaryReferences: clientTemporaryReferences,
    });
    return result;
  }

  return React.cache(cachedFn);
}

class StreamCacher {
  constructor(private stream: ReadableStream<Uint8Array>) {}
  get(): ReadableStream<Uint8Array> {
    const [returnStream, savedStream] = this.stream.tee();
    this.stream = savedStream;
    return returnStream;
  }
}

function arrayBufferToString(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  if (len < 65535) {
    return String.fromCharCode.apply(null, bytes as unknown as number[]);
  }
  let binary = "";
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return binary;
}
