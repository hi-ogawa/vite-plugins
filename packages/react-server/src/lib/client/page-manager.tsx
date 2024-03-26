import React from "react";
import { __global } from "../global";
import { TinyStore, useStore } from "./store-utils";

type PageManagerState = {
  pages: Record<string, Promise<React.ReactNode>>;
};

export class PageManager {
  public store = new TinyStore({
    pages: {},
  });
}

export function solvePageMapping(pathname: string) {
  pathname;
}

export const PageManagerContext = React.createContext<PageManager>(undefined!);

export function usePageManager<U = PageManagerState>(
  select?: (v: PageManagerState) => U,
) {
  const ctx = React.useContext(PageManagerContext);
  return useStore(ctx.store, select);
}

export function LayoutContent(props: { name: string }) {
  // TODO: each layout can have transition state?
  // const [isPending, startTransition] = React.useTransition();

  const node = usePageManager((s) => s.pages[props.name]!);

  // wrap each content switch as transition
  const [current, setCurrent] = React.useState(node);
  React.useEffect(() => {
    if (node !== current) {
      __global.startTransition(() => setCurrent(node));
    }
  }, [node]);
  return React.use(current);
}
