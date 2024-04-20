import reactServerDomClient from "react-server-dom-webpack/client.browser";
import { $__global } from "../../lib/global";

// https://github.com/facebook/react/blob/c8a035036d0f257c514b3628e927dd9dd26e5a09/packages/react-client/src/ReactFlightReplyClient.js#L758

export function createServerReference(id: string) {
  return reactServerDomClient.createServerReference(id, (...args) =>
    $__global.callServer(...args),
  );
}
