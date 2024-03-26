import React from "react";
import { __global } from "../global";
import { type ManualPromise, getPathPrefixes } from "../utils";
import { TinyStore, useStore } from "./store-utils";

// TODO: rename to layout manager?

type PageManagerState = {
  pages: Record<string, Promise<React.ReactNode>>;
};

export class PageManager {
  public store = new TinyStore({
    pages: {},
  });
}

export const LAYOUT_ROOT_NAME = "__root";

// LayoutContentRequestEntry
export type LayoutContentEntry = {
  type: "page" | "layout";
  name: string;
};

// LayoutContentRequestMapping
export type LayoutContentMapping = Record<string, LayoutContentEntry>;

export type ServerLayoutContentMapping = Record<string, React.ReactNode>;

export type StreamLayoutContentMapping = Record<
  string,
  ReadableStream<Uint8Array>
>;

export type ClientLayoutContentMapping = Record<
  string,
  ManualPromise<React.ReactNode>
>;

// TODO: test
// TODO: keep common prefix when navigating
export function solveLayoutContentMapping(pathname: string) {
  const parts = getPathPrefixes(pathname);
  const mapping: LayoutContentMapping = {};
  for (let i = 0; i < parts.length; i++) {
    const [prefix] = parts[i]!;
    if (i < parts.length - 1) {
      mapping[prefix] = {
        type: "layout",
        name: parts[i + 1]![0],
      };
    } else {
      mapping[prefix] = {
        type: "page",
        name: prefix,
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

// result
// <Layout><LayoutContent name="" /><
// export function LayoutRoot() {
//   return <LayoutContent name="__root" />;
// }
