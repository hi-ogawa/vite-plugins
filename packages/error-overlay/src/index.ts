import { type Plugin, type WebSocketClient } from "vite";
import { name as packageName } from "../package.json";

const virtualName = "virtual:runtime-error-overlay";

export function vitePluginErrorOverlay(options?: {
  filter?: (error: Error) => boolean;
}): Plugin {
  return {
    name: packageName,
    apply: "serve",
    transformIndexHtml() {
      return [
        {
          tag: "script",
          attrs: { type: "module", src: "/@id/__x00__" + virtualName },
        },
      ];
    },
    resolveId(source, _importer, _options) {
      return source === virtualName ? "\0" + virtualName : undefined;
    },
    load(id, _options) {
      if (id === "\0" + virtualName) {
        return `(${clientScriptFn.toString()})()`;
      }
      return;
    },
    configureServer(server) {
      server.hot.on("custom:runtime-error", (...args: any[]) => {
        const [data, client] = args as [unknown, WebSocketClient];
        const error = Object.assign(new Error(), data);
        if (options?.filter?.(error) ?? true) {
          client.send({
            type: "error",
            err: {
              message: error.message,
              stack: error.stack ?? "", // TODO: solve sourcemap
            },
          });
        }
      });
    },
  };
}

function clientScriptFn() {
  if (import.meta.hot) {
    window.addEventListener("error", (evt) => {
      sendError(evt.error);
    });

    window.addEventListener("unhandledrejection", (evt) => {
      sendError(evt.reason);
    });

    function sendError(e: unknown) {
      const error =
        e instanceof Error ? e : new Error("(unknown error)", { cause: e });
      const serialized = {
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      };
      import.meta.hot?.send("custom:runtime-error", serialized);
    }
  }
}
