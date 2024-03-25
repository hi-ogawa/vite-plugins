import type { RouterHistory } from "@tanstack/history";
import React from "react";
import { TinyStore, useStore } from "./store-utils";

// TODO: combine two contexts as a single global store?
type ServerTransitionContextType = {
  isPending: boolean;
  isActionPending: boolean;
};

export const ServerTransitionContext =
  React.createContext<ServerTransitionContextType>({
    isPending: false,
    isActionPending: false,
  });

export function useServerTransitionState() {
  return React.useContext(ServerTransitionContext);
}

type RouterState = {
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
        // make it immutable so `useStore` can pick up re-render easily?
        // history: { ...s.history }
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
