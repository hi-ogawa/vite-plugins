import type { HistoryLocation, RouterHistory } from "@tanstack/history";
import React from "react";
import { TinyStore, useStore } from "./store-utils";

type RouterState = {
  history: Omit<RouterHistory, "location">; // hide location from API since history is mutable
  location: HistoryLocation;
  isPending: boolean;
  isActionPending: boolean;
};

export class Router {
  public store: TinyStore<RouterState>;

  constructor(public history: RouterHistory) {
    this.store = new TinyStore<RouterState>({
      history,
      location: history.location,
      isPending: false,
      isActionPending: false,
    });
  }

  setup() {
    return this.history.subscribe(() => {
      this.store.set((s) => ({
        ...s,
        location: this.history.location,
      }));
    });
  }
}

export const RouterContext = React.createContext<Router>(undefined!);

export function useRouter<U = RouterState>(select?: (v: RouterState) => U) {
  const router = React.useContext(RouterContext);
  return useStore(router.store, select);
}
