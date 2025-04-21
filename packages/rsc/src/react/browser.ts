import * as ReactClient from "react-server-dom-webpack/client.browser";
import type { CallServerCallback } from "../types";

export function createFromReadableStream<T>(
  stream: ReadableStream<Uint8Array>,
  options: unknown = {},
): Promise<T> {
  return ReactClient.createFromReadableStream(stream, {
    callServer,
    ...(options as any),
  });
}

export function createFromFetch<T>(
  promiseForResponse: Promise<Response>,
  options: unknown = {},
): Promise<T> {
  return ReactClient.createFromFetch(promiseForResponse, {
    callServer,
    ...(options as any),
  });
}

export function encodeReply(v: unknown[]): Promise<string | FormData> {
  return ReactClient.encodeReply(v);
}

export function createServerReference(id: string): any {
  return ReactClient.createServerReference(id, (...args) =>
    callServer(...args),
  );
}

let callServer!: CallServerCallback;

export function setServerCallback(fn: CallServerCallback): void {
  callServer = fn;
}
