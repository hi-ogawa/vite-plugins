import type { IncomingMessage, OutgoingMessage } from "node:http";

export default async function handler(
  _req: IncomingMessage,
  res: OutgoingMessage,
) {
  res.write("<h1>ok</h1>");
  res.end();
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
