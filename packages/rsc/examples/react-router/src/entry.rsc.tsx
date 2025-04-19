import {
  createClientManifest,
  createServerManifest,
  initialize,
  loadServerAction,
} from "@hiogawa/vite-rsc/core2/rsc";
import {
  type DecodeCallServerFunction,
  type DecodeFormActionFunction,
  type ServerRouteObject,
  matchRSCServerRequest,
} from "react-router/rsc";
// @ts-ignore
import * as ReactServer from "react-server-dom-webpack/server.edge";

initialize();

const routes: ServerRouteObject[] = [
  {
    id: "root",
    lazy: () => import("./routes/root"),
    children: [
      {
        id: "home",
        index: true,
        lazy: () => import("./routes/home"),
      },
      {
        id: "about",
        path: "about",
        lazy: () => import("./routes/about"),
      },
    ],
  },
];

const decodeCallServer: DecodeCallServerFunction = async (actionId, reply) => {
  const args = await ReactServer.decodeReply(reply);
  const action = await loadServerAction(actionId);
  return action.bind(null, ...args);
};

const decodeFormAction: DecodeFormActionFunction = async (formData) => {
  return await ReactServer.decodeAction(formData, createServerManifest());
};

export async function callServer(request: Request) {
  const match = await matchRSCServerRequest({
    decodeCallServer,
    decodeFormAction,
    request,
    routes,
  });

  return new Response(
    ReactServer.renderToReadableStream(match.payload, createClientManifest()),
    {
      status: match.statusCode,
      headers: match.headers,
    },
  );
}
