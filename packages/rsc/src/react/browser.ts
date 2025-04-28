// @ts-ignore
import * as ReactClient from "react-server-dom-webpack/client.browser";
import type { CallServerCallback } from "../types";

export { setRequireModule } from "../core/browser";

export function createFromReadableStream<T>(
  stream: ReadableStream<Uint8Array>,
  options: object = {},
): Promise<T> {
  return ReactClient.createFromReadableStream(stream, {
    callServer,
    findSourceMapURL,
    ...options,
  });
}

export function createFromFetch<T>(
  promiseForResponse: Promise<Response>,
  options: object = {},
): Promise<T> {
  return ReactClient.createFromFetch(promiseForResponse, {
    callServer,
    findSourceMapURL,
    ...options,
  });
}

export function encodeReply(
  v: unknown[],
  options?: unknown,
): Promise<string | FormData> {
  return ReactClient.encodeReply(v, options);
}

// TODO: this likely means we cannot have automatic `callServer` wrapper...?
// https://github.com/facebook/react/pull/30741
// The compiled output must call these directly without a wrapper function
// because the wrapper adds a stack frame. I decided against complicated
// and fragile dev-only options to skip n number of frames that would just
// end up in prod code. The implementation just skips one frame - our own.
// Otherwise it'll just point all source mapping to the wrapper.
export function createServerReference(id: string): unknown {
  return ReactClient.createServerReference(
    id,
    callServer,
    undefined,
    findSourceMapURL,
  );
}

// use global instead of local variable  to tolerate duplicate modules
// e.g. when `setServerCallback` is pre-bundled but `createServerReference` is not

function callServer(...args: any[]): any {
  return (globalThis as any).__viteRscCallServer(...args);
}

export function setServerCallback(fn: CallServerCallback): void {
  (globalThis as any).__viteRscCallServer = fn;
}

export type { CallServerCallback };

export const createTemporaryReferenceSet: () => unknown =
  ReactClient.createTemporaryReferenceSet;

function findSourceMapURL(filename: string, environmentName: string) {
  if (!import.meta.env.DEV) return null;
  // TODO: respect config.server.origin and config.base?
  const url = new URL("/__vite_rsc_findSourceMapURL", window.location.origin);
  url.searchParams.set("filename", filename);
  url.searchParams.set("environmentName", environmentName);
  return url.toString();
}
