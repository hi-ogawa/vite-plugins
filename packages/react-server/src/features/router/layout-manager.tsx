import {
  createDebug,
  createManualPromise,
  objectMapValues,
  tinyassert,
} from "@hiogawa/utils";
import React from "react";
import { TinyStore, useStore } from "../../lib/client/store-utils";
import { __global } from "../../lib/global";
import { LAYOUT_ROOT_NAME } from "./utils";

const debug = createDebug("react-server:layout");

// TODO: feel like "map" wouldn't be enough in the future,
//       so rename it something more general? like `ClientLayoutData`?
// TODO: flag to indicate current layout is from server action? (for isActionPending transition?)
type LayoutManagerState = {
  data: Record<string, Promise<React.ReactNode>>;
};

export class LayoutManager {
  public store = new TinyStore<LayoutManagerState>({
    data: {},
  });

  update(data: ClientLayoutData) {
    this.store.set((s) => {
      debug("[update]", { current: s.data, next: data });
      return {
        ...s,
        data: {
          ...s.data,
          ...data,
        },
      };
    });
  }
}

export type LayoutRequest = Record<
  string,
  {
    type: "page" | "layout";
    name: string;
  }
>;

export type ServerLayoutData = Record<string, React.ReactNode>;

export type ClientLayoutData = Record<string, Promise<React.ReactNode>>;

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

  const node = useLayoutManager((s) => s.data[props.name]);

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

export function flattenLayoutMapPromise(
  keys: string[],
  promiseOfMap: Promise<ServerLayoutData>,
): ClientLayoutData {
  const mapOfPromise = Object.fromEntries(
    keys.map((k) => [k, createManualPromise<React.ReactNode>()]),
  );
  (async () => {
    try {
      const map = await promiseOfMap;
      for (const [k, v] of Object.entries(map)) {
        const promise = mapOfPromise[k];
        tinyassert(promise);
        promise.resolve(v);
      }
    } catch (e) {
      for (const promise of Object.values(mapOfPromise)) {
        promise.reject(e);
      }
    }
  })();
  return objectMapValues(mapOfPromise, (v) => v.promise);
}
