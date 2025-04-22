import * as ReactServer from "@hiogawa/vite-rsc/react/rsc";

// https://github.com/facebook/react/blob/c8a035036d0f257c514b3628e927dd9dd26e5a09/packages/react-server-dom-webpack/src/ReactFlightWebpackReferences.js#L43

// $$id: /src/components/counter.tsx#Counter
//   ⇕
// id: /src/components/counter.tsx
// name: Counter

/* @__NO_SIDE_EFFECTS__ */
export function registerClientReference(id: string, name: string) {
  return ReactServer.registerClientReference({}, id, name);
}
