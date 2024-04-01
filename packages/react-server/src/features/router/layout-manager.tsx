import {
  createDebug,
  createManualPromise,
  objectMapValues,
  tinyassert,
} from "@hiogawa/utils";
import React from "react";
import { TinyStore } from "../../lib/client/store-utils";
import { __global } from "../../lib/global";
import {
  type ClientLayoutData,
  LAYOUT_ROOT_NAME,
  type ServerLayoutData,
} from "./utils";

const debug = createDebug("react-server:layout");

type LayoutManagerState = {
  data: ClientLayoutData;
  transitionType?: "navigation" | "action";
};

export class LayoutManager {
  public store = new TinyStore<LayoutManagerState>({
    data: {},
  });

  update(data: ClientLayoutData, transitionType?: "navigation" | "action") {
    this.store.set((s) => {
      debug("[update]", { current: s.data, next: data });
      return {
        ...s,
        data: {
          ...s.data,
          ...data,
        },
        transitionType,
      };
    });
  }
}

type LayoutStateContextType = {
  data: Promise<ServerLayoutData>;
};

export const LayoutStateContext = React.createContext<LayoutStateContextType>(
  undefined!,
);

export const LayoutManagerContext = React.createContext<LayoutManager>(
  undefined!,
);
export function LayoutContent(props: { name: string }) {
  const layoutState = React.useContext(LayoutStateContext);
  const layout = React.use(layoutState.data);
  return layout[props.name];
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
