import * as ReactClient from "react-server-dom-webpack/client.edge";
import { createServerConsumerManifest } from "../ssr";

export function createFromReadableStream<T>(
  stream: ReadableStream<Uint8Array>,
  options: unknown = {},
): Promise<T> {
  return ReactClient.createFromReadableStream(stream, {
    serverConsumerManifest: createServerConsumerManifest(),
    ...(options as any),
  });
}

export function createServerReference(id: string): unknown {
  return ReactClient.createServerReference(id);
}
