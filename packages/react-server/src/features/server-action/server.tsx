import reactServerDomClient from "react-server-dom-webpack/client.edge";

/* @__NO_SIDE_EFFECT */
export function createServerReference(id: string) {
  return reactServerDomClient.createServerReference(id, (...args) => {
    console.error(args);
    throw new Error("unexpected callServer during SSR");
  });
}
