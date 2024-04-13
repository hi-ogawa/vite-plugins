import reactServerDomClient from "react-server-dom-webpack/client.edge";

export function createServerReference(id: string) {
  const reference = reactServerDomClient.createServerReference(
    id,
    (...args) => {
      console.error(args);
      throw new Error("unexpected callServer during SSR");
    },
  );
  // for now, this is for our DIY `useActionData` system.
  Object.assign(reference, { $$id: id });
  return reference;
}
