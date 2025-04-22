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
    ...options,
  });
}

export function createFromFetch<T>(
  promiseForResponse: Promise<Response>,
  options: object = {},
): Promise<T> {
  return ReactClient.createFromFetch(promiseForResponse, {
    callServer,
    ...options,
  });
}

export function encodeReply(v: unknown[]): Promise<string | FormData> {
  return ReactClient.encodeReply(v);
}

export function createServerReference(id: string): unknown {
  return ReactClient.createServerReference(id, (...args: any[]) =>
    (callServer as any)(...args),
  );
}

let callServer!: CallServerCallback;

export function setServerCallback(fn: CallServerCallback): void {
  callServer = fn;
}

export type { CallServerCallback };
