import * as ReactClient from "@hiogawa/vite-rsc/browser";
import { unstable_callServerRsc } from "waku/minimal/client";
ReactClient.setServerCallback(unstable_callServerRsc);

// TODO: server HMR
if (import.meta.hot) {
  import.meta.hot.on("rsc:update", () => {});
}
