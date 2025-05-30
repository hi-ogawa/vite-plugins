import type { ReactFormState } from "react-dom/client";
// @ts-ignore
import * as ReactServer from "react-server-dom-webpack/server.edge";
import { createClientManifest, createServerManifest } from "../core/rsc";

export { loadServerAction, setRequireModule } from "../core/rsc";

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

export const registerServerReference: <T>(
  ref: T,
  id: string,
  name: string,
) => T = ReactServer.registerServerReference;

export function decodeReply(
  body: string | FormData,
  options?: unknown,
): Promise<unknown[]> {
  return ReactServer.decodeReply(body, createServerManifest(), options);
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

export const createTemporaryReferenceSet: () => unknown =
  ReactServer.createTemporaryReferenceSet;
