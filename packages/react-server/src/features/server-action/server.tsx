import reactServerDomClient from "react-server-dom-webpack/client.edge";

export function createServerReferenceServer(id: string) {
  const reference = reactServerDomClient.createServerReference(
    id,
    (...args) => {
      console.log(args);
      throw new Error("no callServer for SSR?");
    },
  );
  // for now, this is for our custom `useActionData` system
  Object.assign(reference, { $$id: id });
  return reference;
}
