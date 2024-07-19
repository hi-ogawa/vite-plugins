import { type Plugin, type WebSocketClient } from "vite";
import { name as packageName } from "../package.json";

const virtualName = "virtual:runtime-error-overlay";

export function vitePluginErrorOverlay(
  options: {
    filter?: (error: Error) => boolean;
    patchConsoleError?: boolean;
  } = {},
): Plugin {
  return {
    name: packageName,
    apply: "serve",
    transformIndexHtml() {
      return [
        {
          tag: "script",
          // TODO: base?
          attrs: { type: "module", src: "/@id/__x00__" + virtualName },
        },
      ];
    },
    resolveId(source, _importer, _options) {
      return source === virtualName ? "\0" + virtualName : undefined;
    },
    load(id, _options) {
      if (id === "\0" + virtualName) {
        return `(${clientScriptFn.toString()})(${JSON.stringify(options)})`;
      }
      return;
    },
    configureServer(server) {
      server.ws.on("custom:runtime-error", (...args: any[]) => {
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

function clientScriptFn(options: { patchConsoleError?: boolean }) {
  if (import.meta.hot) {
    window.addEventListener("error", (evt) => {
      sendError(evt.error);
    });

    window.addEventListener("unhandledrejection", (evt) => {
      sendError(evt.reason);
    });

    // monkey-patch console.error to collect errors handled by error boundaries
    // https://github.com/facebook/react/blob/9defcd56bc3cd53ac2901ed93f29218007010434/packages/react-reconciler/src/ReactFiberErrorLogger.js#L24-L31
    // https://github.com/vercel/next.js/blob/904908cf33bda1dfc50d81a19f3fc60c2c20f8da/packages/next/src/client/components/react-dev-overlay/internal/helpers/hydration-error-info.ts#L56
    if (options.patchConsoleError) {
      const oldFn = console.error;
      console.error = function (...args) {
        for (const arg of args) {
          if (arg instanceof Error) {
            sendError(arg);
          }
        }
        oldFn.apply(this, args);
      };
    }

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
