import React from "react";
import { __global } from "../global";
import { getPathPrefixes } from "../router-utils";
import { TinyStore, useStore } from "./store-utils";

type PageManagerState = {
  pages: Record<string, Promise<React.ReactNode>>;
};

export class PageManager {
  public store = new TinyStore({
    pages: {},
  });
}

type LayoutContentEntry = {
  type: "page" | "layout";
  pathname: string;
};

type LayoutContentMapping = Record<string, LayoutContentEntry>;

// TODO: test
export function solveLayoutContentMapping(from: string, to: string) {
  // TODO: keep common entries
  const toParts = getPathPrefixes(to);
  const fromParts = getPathPrefixes(from);
  fromParts;

  const mapping: LayoutContentMapping = {};
  for (let i = 0; i < toParts.length; i++) {
    const [prefix] = toParts[i]!;
    if (i < toParts.length - 1) {
      mapping[prefix] = {
        type: "layout",
        pathname: toParts[i + 1]![0],
      };
    } else {
      mapping[prefix] = {
        type: "page",
        pathname: prefix,
      };
    }
  }
  return { mapping };
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
