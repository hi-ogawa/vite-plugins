import { createDebug, tinyassert } from "@hiogawa/utils";
import React from "react";
import { TinyStore, useStore } from "../../lib/client/store-utils";
import { __global } from "../../lib/global";
import { getPathPrefixes } from "../../lib/utils";
import { decodeStreamMap } from "../../utils/stream";

// TODO: rename to layout manager?

const debug = createDebug("react-server:layout");

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

  const node = usePageManager((s) => s.pages[props.name]);

  // wrap each content switch as transition
  const [current, setCurrent] = React.useState(node);
  React.useEffect(() => {
    if (node !== current) {
      debug("[LayoutContent]", { name: props.name, node, current });
      __global.startTransition(() => setCurrent(node));
    }
  }, [node]);

  return current && React.use(current);
}

export function LayoutRoot() {
  return <LayoutContent name={LAYOUT_ROOT_NAME} />;
}

export function createLayoutFromStream(
  pathname: string,
  reactNodeFromStream: (
    stream: ReadableStream<Uint8Array>,
  ) => Promise<React.ReactNode>,
  getLayoutStream: () => Promise<ReadableStream<unknown>>,
): ClientLayoutContentMapping {
  const keys = Object.keys(solveLayoutContentMapping(pathname).mapping);
  const clientLayoutMap = Object.fromEntries(
    keys.map((k) => [k, createManualPromise()]),
  );
  (async () => {
    const stream = await getLayoutStream();
    const streamMap = await decodeStreamMap(stream);
    for (const [key, stream] of Object.entries(streamMap.streams)) {
      const promise = clientLayoutMap[key];
      tinyassert(promise);
      promise.resolve(
        reactNodeFromStream(stream.pipeThrough(new TextEncoderStream())),
      );
    }
  })();
  return clientLayoutMap as any;
}

export interface ManualPromise<T> extends PromiseLike<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (value: unknown) => void;
}

export function createManualPromise<T>(): ManualPromise<T> {
  let resolve!: ManualPromise<T>["resolve"];
  let reject!: ManualPromise<T>["reject"];
  const promise = new Promise<T>((resolve_, reject_) => {
    resolve = resolve_;
    reject = reject_;
  });
  return { promise, resolve, reject, then: promise.then.bind(promise) };
}
