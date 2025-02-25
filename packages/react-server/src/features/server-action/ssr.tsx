import ReactClient from "react-server-dom-webpack/client.edge";

/* @__NO_SIDE_EFFECTS__ */
export function createServerReference(id: string): Function {
  return ReactClient.createServerReference(id, (...args) => {
    console.error(args);
    throw new Error("unexpected callServer during SSR");
  });
}
