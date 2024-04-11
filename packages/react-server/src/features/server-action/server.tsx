import { tinyassert } from "@hiogawa/utils";
import reactServerDomClient from "react-server-dom-webpack/client.edge";

console.log("[import]", import.meta.url);

export function createServerReferenceServer(id: string) {
  return reactServerDomClient.createServerReference(id, async () => {
    tinyassert(false);
  });
}
