import React from "react";
import { TinyStore, useStore } from "./store-utils";

type PageManagerState = {
  pages: Record<string, Promise<React.ReactNode>>;
};

export class PageManager {
  public store = new TinyStore({
    pages: {},
  });
}

export const PageManagerContext = React.createContext<PageManager>(undefined!);

export function usePageManager<U = PageManagerState>(
  select?: (v: PageManagerState) => U,
) {
  const ctx = React.useContext(PageManagerContext);
  return useStore(ctx.store, select);
}
