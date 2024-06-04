import {
  type HistoryLocation,
  type RouterHistory,
  createBrowserHistory,
} from "@tanstack/history";
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

  constructor(private history: RouterHistory) {
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

export function createEncodedBrowserHistory() {
  // patch push/replace so that location object consistently includes encoded url
  // (i.e. history.push("/✅") should set { pathname: "/%E2%9C%85" } as state)
  // cf.
  // https://github.com/remix-run/react-router/pull/9477
  // https://github.com/TanStack/router/issues/1441

  const history = createBrowserHistory();

  function encode(href: string) {
    const url = new URL(href, window.location.origin);
    return url.href.slice(url.origin.length);
  }

  function wrapEncode(f: typeof history.push): typeof history.push {
    return (path, state) => f(encode(path), state);
  }

  history.push = wrapEncode(history.push);
  history.replace = wrapEncode(history.replace);
  return history;
}
