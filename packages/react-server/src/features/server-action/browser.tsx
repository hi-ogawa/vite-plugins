import ReactClient from "react-server-dom-webpack/client.browser";
import { $__global } from "../../global";

// https://github.com/facebook/react/blob/c8a035036d0f257c514b3628e927dd9dd26e5a09/packages/react-client/src/ReactFlightReplyClient.js#L758

/* @__NO_SIDE_EFFECTS__ */
export function createServerReference(id: string) {
  return ReactClient.createServerReference(id, (...args) =>
    $__global.callServer(...args),
  );
}
