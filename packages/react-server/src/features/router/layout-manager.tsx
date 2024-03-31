import React from "react";
import { TinyStore, useStore } from "../../lib/client/store-utils";
import { __global } from "../../lib/global";
import { getPathPrefixes } from "../../lib/utils";

// TODO: rename to layout manager?

type LayoutManagerState = {
  pages: Record<string, Promise<React.ReactNode>>;
};

export class LayoutManager {
  public store = new TinyStore({
    pages: {},
  });
}

const LAYOUT_ROOT_NAME = "__root";

// TODO: naming?
export type LayoutContentRequestEntry = {
  type: "page" | "layout";
  name: string;
};

export type LayoutContentRequest = Record<string, LayoutContentRequestEntry>;

export type StreamLayoutContentMapping = Record<
  string,
  ReadableStream<Uint8Array>
>;

export type ClientLayoutContentMapping = Record<
  string,
  Promise<React.ReactNode>
>;

// TODO: test
// TODO: keep common prefix when navigating
export function solveLayoutContentMapping(pathname: string) {
  const parts = getPathPrefixes(pathname);
  const mapping: LayoutContentRequest = {};
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
  mapping[LAYOUT_ROOT_NAME] = { type: "layout", name: "" };
  return { mapping };
}

export const PageManagerContext = React.createContext<LayoutManager>(
  undefined!,
);

function usePageManager<U = LayoutManagerState>(
  select?: (v: LayoutManagerState) => U,
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

export function LayoutRoot() {
  return <LayoutContent name={LAYOUT_ROOT_NAME} />;
}
