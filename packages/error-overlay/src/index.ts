import { type HMRPayload, type Plugin, type WebSocketClient } from "vite";
import { name as packageName } from "../package.json";
import { parseStacktrace } from "./stack";

// based on the idea in
// https://github.com/vitejs/vite/pull/6274#issuecomment-1087749460
// https://github.com/vitejs/vite/issues/2076

// TODO: the PR has utility to construct "frame"
// getStackLineInformation
// generateErrorPayload
// generateFrame

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
          attrs: { type: "module" },
          children: CLIENT_SCRIPT,
        },
      ];
    },

    configureServer(server) {
      const sendDebounce = debounce(
        (client: WebSocketClient, payload: HMRPayload) => {
          client.send(payload);
        },
        200,
      );

      server.hot.send({
        type: "error",
        err: {
          message: "",
          stack: "",
        },
      });
      server.hot.on(MESSAGE_TYPE, (...args: any[]) => {
        const [data, client] = args as [unknown, WebSocketClient];

        // deserialize error
        const error = Object.assign(new Error(), data);

        if (options?.filter && !options.filter(error)) {
          return;
        }

        let stack = `${error.name}: ${error.message}\n`;
        if (error.stack) {
          stack += formatStack(error.stack);
        }
        sendDebounce(client, {
          type: "error",
          err: {
            message: error.message,
            stack,
          },
        });
      });
    },
  };
}

const MESSAGE_TYPE = `${packageName}:error`;

// cf. https://github.com/vitejs/vite/blob/f8e0791e3f7c7c39c041a563e77396eca706d05e/packages/vite/src/client/client.ts#L313
const CLIENT_SCRIPT = /* js */ `

// import { createHotContext, ErrorOverlay } from "/@vite/client";
import { ErrorOverlay } from "/@vite/client";

function createErrorOverlay(err) {
  document.querySelectorAll("vite-error-overlay").forEach((n) => n.close());
  document.body.appendChild(new ErrorOverlay(err));
};

// document.querySelectorAll(overlayId).forEach((n) => n.close());

// document.querySelectorAll<ErrorOverlay>(overlayId).forEach((n) => n.close());

// // fake file path to instantiate import.meta.hot
// const hot = createHotContext("__${packageName}__");

// function sendError(error) {
//   if (!(error instanceof Error)) {
//     error = new Error("(unknown runtime error)");
//   }
//   const serialized = {
//     name: error.name,
//     message: error.message,
//     stack: error.stack,
//   };
//   hot.send("${MESSAGE_TYPE}", serialized);
// }

window.addEventListener("error", (evt) => {
  // sendError(evt.error);
  createErrorOverlay(evt.error);
});

window.addEventListener("unhandledrejection", (evt) => {
  // sendError(evt.reason);
  createErrorOverlay(evt.reason);
});

`;

function formatStack(s: string) {
  const stacks = parseStacktrace(s);
  return stacks
    .map((s) => `    at ${s.method} (${s.file}:${s.line}:${s.column})\n`)
    .join("");
}

function debounce<F extends (...args: any[]) => any>(f: F, ms: number) {
  let unsub: ReturnType<typeof setTimeout> | undefined;

  function wrapper(this: unknown, ...args: any[]) {
    if (typeof unsub !== "undefined") {
      clearTimeout(unsub);
      unsub = undefined;
    }
    unsub = setTimeout(() => {
      f.apply(this, args);
    }, ms);
  }

  return wrapper as F;
}
