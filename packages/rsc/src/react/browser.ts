// @ts-ignore
import * as ReactClient from "react-server-dom-vite/client.browser";
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

export const createServerReference: (...args: any[]) => unknown =
  ReactClient.createServerReference;

// use global instead of local variable  to tolerate duplicate modules
// e.g. when `setServerCallback` is pre-bundled but `createServerReference` is not

export function callServer(...args: any[]): any {
  return (globalThis as any).__viteRscCallServer(...args);
}

export function setServerCallback(fn: CallServerCallback): void {
  (globalThis as any).__viteRscCallServer = fn;
}

export type { CallServerCallback };

export const createTemporaryReferenceSet: () => unknown =
  ReactClient.createTemporaryReferenceSet;

export function findSourceMapURL(
  filename: string,
  environmentName: string,
): string | null {
  if (!import.meta.env.DEV) return null;
  // TODO: respect config.server.origin and config.base?
  const url = new URL("/__vite_rsc_findSourceMapURL", window.location.origin);
  url.searchParams.set("filename", filename);
  url.searchParams.set("environmentName", environmentName);
  return url.toString();
}
