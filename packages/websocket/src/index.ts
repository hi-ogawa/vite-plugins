import { isRunnableDevEnvironment, type HttpServer, type Plugin } from "vite";
import { WebSocketServer } from "ws";
import { createRequest } from "@remix-run/node-fetch-server"
import type { IncomingMessage } from "node:http";
import assert from "node:assert";

// polyfill cloudflare workers style websocket handling pattern?
// probably that's what miniflare implements?
// https://github.com/cloudflare/workers-sdk/blob/e15a72cfe774e938dc02690621b17570d46e8dff/packages/vite-plugin-cloudflare/src/websockets.ts#L25-L27

// no, the point is that we want to expose "standard node server websocket" style 
// experience. for cloudflare style websocket, they should be available through their plugin.
// in that case, we can even assume `WebSocketServer` is the one provided by server entry?

// import {} from "vite-plugin-websocket/runtime"

// export const websocketServer = new WebSocketServer(...);
// websocketServer.on("connection", () => ...)

// if (import.meta.hot) {
//   import.meta.hot.dispose(() => websocketServer.close());
// }

// probably reverse the concept and it would be something like "vite-plugin-node-server"?
// - vite-plugin-node-server/runtime
//   - expose node server  (framework)
//   - consume node server (framework user code)

export default function websocketPlugin(websocketPluginOpitons?: {
  handler?: {
    /** @default "ssr" */
    environmentName?: string;
    entryName?: string;
  };
}): Plugin[] {
  websocketPluginOpitons;
  return [
    {
      name: "websocket",
      configureServer(server) {
        assert(isRunnableDevEnvironment(server.environments.ssr));
        const runner = server.environments.ssr.runner;
        if (server.httpServer) {
          server.httpServer.on("upgrade", async (req: IncomingMessage, socket, head) => {
            // Ignore Vite HMR WebSockets
            if (req.headers["sec-websocket-protocol"]?.startsWith("vite")) {
              return;
            }

            try {
              // const { websocketServer } = await runner.import("/websocket");
            } catch (e) {
              // TODO
            }

            // req.headers;
            // const request = createRequest(req, { on: () => {} } as any);
            // request.headers;

            // // TODO: request to handler
            // // "Upgrade";

            // nodeWebSocket.handleUpgrade(
            //   req,
            //   socket,
            //   head,
            //   async (clientWebSocket) => {
            //     coupleWebSocket;
            //     clientWebSocket;
            //     nodeWebSocket.emit("connection", clientWebSocket, req);
            //   },
            // );
          });          
          // server.httpServer.on("")
          // handleWebsocket(server.httpServer);
        }
      },
      configurePreviewServer(server) {
        if (server.httpServer) {
        }
      },
    },
  ];
}

function handleWebsocket(httpServer: HttpServer) {
  const nodeWebSocket = new WebSocketServer({ noServer: true });
  nodeWebSocket.on("connection", (ws, req) => {
    ws;
    req;
  });

  httpServer.on("upgrade", (req: IncomingMessage, socket, head) => {
    // Ignore Vite HMR WebSockets
    if (req.headers["sec-websocket-protocol"]?.startsWith("vite")) {
      return;
    }

    req.headers;
    const request = createRequest(req, { on: () => {} } as any);
    request.headers;

    // TODO: request to handler
    // "Upgrade";

    nodeWebSocket.handleUpgrade(
      req,
      socket,
      head,
      async (clientWebSocket) => {
        coupleWebSocket;

        // clientWebSocket.emit("...")
        // clientWebSocket.on("message", (data) => {
        //   console.log("message", data);
        //   clientWebSocket.send(data);
        // });

        nodeWebSocket.emit("connection", clientWebSocket, req);
      },
    );
  });
}

function coupleWebSocket() {}

function getEntrySource() {}
