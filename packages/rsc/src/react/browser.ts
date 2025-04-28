// @ts-ignore
import * as ReactClient from "react-server-dom-webpack/client.browser";
import type { CallServerCallback } from "../types";

export { setRequireModule } from "../core/browser";

export function createFromReadableStream<T>(
  stream: ReadableStream<Uint8Array>,
  options: object = {},
): Promise<T> {
  return ReactClient.createFromReadableStream(stream, {
    callServer: getCallServer(),
    findSourceMapURL,
    ...options,
  });
}

export function createFromFetch<T>(
  promiseForResponse: Promise<Response>,
  options: object = {},
): Promise<T> {
  return ReactClient.createFromFetch(promiseForResponse, {
    callServer: getCallServer(),
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

export function createServerReference(id: string): unknown {
  return ReactClient.createServerReference(id, (...args: any[]) =>
    getCallServer()(...args),
  );
}

// use global instead of local variable  to tolerate duplicate modules
// e.g. when `setServerCallback` is pre-bundled but `createServerReference` is not

function getCallServer(): any {
  return (globalThis as any).__viteRscCallServer;
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
