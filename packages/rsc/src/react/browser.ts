import * as ReactClient from "react-server-dom-webpack/client.browser";
import type { CallServerCallback } from "../types";

export const __client = ReactClient as any;

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
  return ReactClient.createServerReference(id, callServer);
}

const callServer: CallServerCallback = (...args) =>
  __viteRscCallServer(...args);
