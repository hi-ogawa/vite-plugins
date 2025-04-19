import {
  createClientManifest,
  createServerManifest,
  importSsr,
  initialize,
} from "@hiogawa/vite-rsc/server";
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
  const action = await ReactServer.loadServerAction(actionId);
  return action.bind(null, ...args);
};

const decodeFormAction: DecodeFormActionFunction = async (formData) => {
  return await ReactServer.decodeAction(formData, createServerManifest());
};

async function callServer(request: Request) {
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

export default async function handler(request: Request) {
  const ssr = await importSsr<typeof import("./entry.ssr")>();
  return ssr.default(request, callServer);
}
