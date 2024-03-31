import { __global } from "../../lib/global";
import { injectActionId } from "./utils";

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightWebpackReferences.js#L87
// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-client/src/ReactFlightReplyClient.js#L671-L678

export function createServerReference(id: string): React.FC {
  return Object.defineProperties(
    (...args: unknown[]) => {
      return __global.callServer(id, args);
    },
    {
      $$typeof: {
        value: Symbol.for("react.server.reference"),
      },
      $$id: {
        value: id,
        configurable: true,
      },
      $$bound: { value: null, configurable: true },
      $$FORM_ACTION: {
        value: (name: string) => {
          const data = new FormData();
          injectActionId(data, id);
          return {
            name,
            method: "POST",
            encType: "multipart/form-data",
            data,
          };
        },
      },
      bind: {
        value: () => {
          throw new Error("todo: createServerReference.bind");
        },
        configurable: true,
      },
    },
  ) as any;
}
