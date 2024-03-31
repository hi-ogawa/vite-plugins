import {
  type ManualPromise,
  createDebug,
  createManualPromise,
  tinyassert,
} from "@hiogawa/utils";
import React from "react";
import { TinyStore, useStore } from "../../lib/client/store-utils";
import { __global } from "../../lib/global";
import { decodeStreamMap } from "../../utils/stream";
import { LAYOUT_ROOT_NAME, createLayoutContentRequest } from "./utils";

const debug = createDebug("react-server:layout");

type LayoutManagerState = {
  pages: Record<string, Promise<React.ReactNode>>;
};

export class LayoutManager {
  public store = new TinyStore<LayoutManagerState>({
    pages: {},
  });
}

export type LayoutRequest = Record<
  string,
  {
    type: "page" | "layout";
    name: string;
  }
>;

export type StreamLayoutMap = Record<string, ReadableStream<Uint8Array>>;

export type ClientLayoutMap = Record<
  string,
  Promise<React.ReactNode> | ManualPromise<React.ReactNode>
>;

export const LayoutManagerContext = React.createContext<LayoutManager>(
  undefined!,
);

function useLayoutManager<U = LayoutManagerState>(
  select?: (v: LayoutManagerState) => U,
) {
  const ctx = React.useContext(LayoutManagerContext);
  return useStore(ctx.store, select);
}

export function LayoutContent(props: { name: string }) {
  // TODO: each layout can have transition state?
  // const [isPending, startTransition] = React.useTransition();

  const node = useLayoutManager((s) => s.pages[props.name]);

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

export function createLayoutMapFromStream(
  pathname: string,
  reactNodeFromStream: (
    stream: ReadableStream<Uint8Array>,
  ) => Promise<React.ReactNode>,
  getLayoutStream: () => Promise<ReadableStream<unknown>>,
): ClientLayoutMap {
  const keys = Object.keys(createLayoutContentRequest(pathname));
  const clientLayoutMap = Object.fromEntries(
    keys.map((k) => [k, createManualPromise<React.ReactNode>()]),
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
  return clientLayoutMap;
}
