// @ts-ignore
import * as ReactClient from "react-server-dom-vite/client.edge";

export { setRequireModule } from "../core/ssr";

export function createFromReadableStream<T>(
  stream: ReadableStream<Uint8Array>,
  options: object = {},
): Promise<T> {
  return ReactClient.createFromReadableStream(stream, {
    ...options,
  });
}

export function createServerReference(id: string): unknown {
  return ReactClient.createServerReference(id);
}

export const callServer = null;
export const findSourceMapURL = null;
