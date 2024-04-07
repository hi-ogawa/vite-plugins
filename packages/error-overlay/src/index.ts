import { type Plugin, type WebSocketClient } from "vite";
import { name as packageName } from "../package.json";

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

    apply(config, env) {
      return env.command === "serve" && !config.ssr;
    },

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
      server.hot.on(MESSAGE_TYPE, (...args: any[]) => {
        const [data, client] = args as [unknown, WebSocketClient];

        // deserialize error
        const error = Object.assign(new Error(), data);

        if (options?.filter && !options.filter(error)) {
          return;
        }

        // https://vitejs.dev/guide/api-plugin.html#client-server-communication
        // https://github.com/vitejs/vite/blob/5b58eca05939c0667cf9698e83f4f4849f3296f4/packages/vite/src/node/server/middlewares/error.ts#L54-L57
        client.send({
          type: "error",
          err: {
            message: error.message,
            stack: error.stack ?? "",
          },
        });
      });
    },
  };
}

const MESSAGE_TYPE = `${packageName}:error`;

const CLIENT_SCRIPT = /* js */ `

import { createHotContext } from "/@vite/client";

// fake file path to instantiate import.meta.hot
const hot = createHotContext("__${packageName}__");

function sendError(error) {
  if (!(error instanceof Error)) {
    error = new Error("(unknown runtime error)");
  }
  const serialized = {
    message: error.message,
    stack: error.stack,
  };
  import.meta.hot.send("${MESSAGE_TYPE}", serialized);
}

window.addEventListener("error", (evt) => {
  sendError(evt.error);
});

window.addEventListener("unhandledrejection", (evt) => {
  sendError(evt.reason);
});

`;
