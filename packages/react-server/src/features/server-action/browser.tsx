import reactServerDomClient from "react-server-dom-webpack/client.browser";
import { __global } from "../../lib/global";

console.log("[import]", import.meta.url);

export function createServerReferenceBrowser(id: string) {
  return reactServerDomClient.createServerReference(id, async (...args) => {
    return __global.callServer(...args);
  });
}
