// https://github.com/lazarv/react-server/blob/2ff6105e594666065be206729858ecfed6f5e8d8/packages/react-server/client/components.mjs#L15-L25
export function createClientReference(Component: React.FC): React.FC {
  Object.defineProperties(Component, {
    $$typeof: {
      value: Symbol.for("react.client.reference"),
    },
    $$id: {
      value: `__some_client_id`,
    },
    $$async: {
      value: true,
    },
  });
  return Component;
}
