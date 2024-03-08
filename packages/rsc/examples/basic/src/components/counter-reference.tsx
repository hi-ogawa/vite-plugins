// TODO: transform via "use client" directive during RSC

// cf. https://github.com/lazarv/react-server/blob/2ff6105e594666065be206729858ecfed6f5e8d8/packages/react-server/client/components.mjs#L15-L25
export const Counter = createClientReference(
  "/src/components/counter.tsx::Counter"
);

function createClientReference(id: string): React.FC {
  return Object.defineProperties(() => {}, {
    $$typeof: {
      value: Symbol.for("react.client.reference"),
    },
    $$id: {
      value: id,
    },
    $$async: {
      value: true,
    },
  }) as any;
}
