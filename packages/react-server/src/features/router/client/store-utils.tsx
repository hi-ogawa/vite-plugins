import React from "react";

// tanstack-style selectable store
// https://github.com/TanStack/router/blob/876b887589b14fb4bce0773eb520417682a741e2/packages/react-router/src/useRouterState.tsx
// https://github.com/TanStack/store/blob/8d6faa0c8eb54b5b1070148311e43bb011a929f9/packages/react-store/src/index.ts

interface ReadableStore<T> {
  get: () => T;
  subscribe: (listener: () => void) => () => void;
}

export function useStore<T, U = T>(
  store: ReadableStore<T>,
  selector: (v: T) => U = (v: T) => v as any,
): U {
  const v = useSyncExternalStoreWithSelectorDIY(
    store.subscribe,
    store.get,
    selector as any,
    isEqualShallow,
  );
  return v as any;
}

// from tiny-store
// https://github.com/hi-ogawa/js-utils/blob/63d573a4b0eeeb119059c19680e14c12d64b8a1a/packages/tiny-store/src/core.ts
export class TinyStore<T> implements ReadableStore<T> {
  private listeners = new Set<() => void>();

  constructor(private value: T) {}

  get = () => this.value;

  set = (action: (v: T) => T) => {
    this.value = action(this.value);
    this.notify();
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify = () => {
    this.listeners.forEach((l) => l());
  };
}

function isEqualShallow(x: object, y: object): boolean {
  if (typeof x !== "object" || typeof y !== "object") {
    return Object.is(x, y);
  }
  // from preact
  // https://github.com/preactjs/preact/blob/4b1a7e9276e04676b8d3f8a8257469e2f732e8d4/compat/src/util.js#L19-L23
  for (const k in x) {
    if (!(k in y)) {
      return false;
    }
  }
  for (const k in y) {
    if ((x as any)[k] !== (y as any)[k]) {
      return false;
    }
  }
  return true;
}

// https://github.com/facebook/react/blob/f09e1599d631051a559974578a6d4c06effd95eb/packages/use-sync-external-store/src/useSyncExternalStoreWithSelector.js
function useSyncExternalStoreWithSelectorDIY<Snapshot, Selection>(
  subscribe: (listener: () => void) => () => void,
  getSnapshot: () => Snapshot,
  selector: (snapshot: Snapshot) => Selection,
  isEqual: (a: Selection, b: Selection) => boolean,
): Selection {
  const getSnapshotWithSelector = React.useMemo(() => {
    let prev: { selection: Selection } | undefined;
    return () => {
      const snapshot = getSnapshot();
      const selection = selector(snapshot);
      if (!(prev && isEqual(selection, prev.selection))) {
        prev = { selection };
      }
      return prev.selection;
    };
  }, [getSnapshot, selector, isEqual]);

  return React.useSyncExternalStore(
    subscribe,
    getSnapshotWithSelector,
    getSnapshotWithSelector,
  );
}
