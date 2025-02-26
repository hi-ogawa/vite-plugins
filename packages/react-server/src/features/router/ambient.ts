import type { RevalidationType } from "../server-component/utils";
import type { ROUTER_REVALIDATE_KEY } from "./client";

declare module "@tanstack/history" {
  interface HistoryState {
    [ROUTER_REVALIDATE_KEY]?: RevalidationType;
  }
}
