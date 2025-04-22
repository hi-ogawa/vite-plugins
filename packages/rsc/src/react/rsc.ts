import type { ReactFormState } from "react-dom/client";
// @ts-ignore
import * as ReactServer from "react-server-dom-webpack/server.edge";
import { createClientManifest, createServerManifest } from "../rsc";

export function renderToReadableStream<T>(
  data: T,
  options?: object,
): ReadableStream<Uint8Array> {
  return ReactServer.renderToReadableStream(
    data,
    createClientManifest(),
    options,
  );
}

export function registerClientReference<T>(
  proxy: T,
  id: string,
  name: string,
): T {
  return ReactServer.registerClientReference(proxy, id, name);
}

export function registerServerReference<T>(
  ref: T,
  id: string,
  name: string,
): T {
  return ReactServer.registerServerReference(ref, id, name);
}

export function decodeReply(body: string | FormData): Promise<unknown[]> {
  return ReactServer.decodeReply(body);
}

export function decodeAction(body: FormData): Promise<() => Promise<void>> {
  return ReactServer.decodeAction(body, createServerManifest());
}

export function decodeFormState(
  actionResult: unknown,
  body: FormData,
): Promise<ReactFormState | undefined> {
  return ReactServer.decodeFormState(
    actionResult,
    body,
    createServerManifest(),
  );
}
