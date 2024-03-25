import type { RouterHistory } from "@tanstack/history";
import React from "react";
import { TinyStore, useStore } from "./store-utils";

type RouterState = {
  // TODO
  // move location at the top level
  // since it's too error prone that
  // useRouter(s => s.history).location doesn't re-render on location change
  history: RouterHistory;
  updateCount: number;
  isPending: boolean;
  isActionPending: boolean;
};

export class Router {
  public store: TinyStore<RouterState>;

  constructor(public history: RouterHistory) {
    this.store = new TinyStore<RouterState>({
      history,
      updateCount: 0,
      isPending: false,
      isActionPending: false,
    });
  }

  setup() {
    return this.history.subscribe(() => {
      this.store.set((s) => ({
        ...s,
        updateCount: s.updateCount + 1,
      }));
    });
  }
}

export const RouterContext = React.createContext<Router>(undefined!);

// TODO: tweak API? useRouter(s => s.history)
export function useRouterState<U = RouterState>(options?: {
  select?: (v: RouterState) => U;
}) {
  const router = React.useContext(RouterContext);
  return useStore(router.store, options?.select);
}

export function useRouter<U = RouterState>(select?: (v: RouterState) => U) {
  const router = React.useContext(RouterContext);
  return useStore(router.store, select);
}
