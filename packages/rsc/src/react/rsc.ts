import type { ReactFormState } from "react-dom/client";
// @ts-ignore
import * as ReactClient from "react-server-dom-vite/client.edge";
// @ts-ignore
import * as ReactServer from "react-server-dom-vite/server.edge";
import {
  clientManifest,
  clientMetadataManifest,
  serverManifest,
} from "../core/rsc";

export { loadServerAction, setRequireModule } from "../core/rsc";

export function renderToReadableStream<T>(
  data: T,
  options?: object,
): ReadableStream<Uint8Array> {
  return ReactServer.renderToReadableStream(
    data,
    clientMetadataManifest,
    options,
  );
}

export function createFromReadableStream<T>(
  stream: ReadableStream<Uint8Array>,
  options: object = {},
): Promise<T> {
  return ReactClient.createFromReadableStream(stream, {
    serverManifest,
    clientManifest,
    ...options,
  });
}

export function registerClientReference<T>(
  proxy: T,
  id: string,
  name: string,
): T {
  return ReactServer.registerClientReference(proxy, id, name);
}

export const registerServerReference: <T>(
  ref: T,
  id: string,
  name: string,
) => T = ReactServer.registerServerReference;

export function decodeReply(
  body: string | FormData,
  options?: unknown,
): Promise<unknown[]> {
  return ReactServer.decodeReply(body, serverManifest, options);
}

export function decodeAction(body: FormData): Promise<() => Promise<void>> {
  return ReactServer.decodeAction(body, serverManifest);
}

export function decodeFormState(
  actionResult: unknown,
  body: FormData,
): Promise<ReactFormState | undefined> {
  return ReactServer.decodeFormState(actionResult, body, serverManifest);
}

export const createTemporaryReferenceSet: () => unknown =
  ReactServer.createTemporaryReferenceSet;
