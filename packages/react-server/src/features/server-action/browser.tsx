import reactServerDomClient from "react-server-dom-webpack/client.browser";
import { __global } from "../../lib/global";

export function createServerReferenceBrowser(id: string) {
  const reference = reactServerDomClient.createServerReference(id, (...args) =>
    __global.callServer(...args),
  );
  Object.assign(reference, { $$id: id });
  return reference;
}
