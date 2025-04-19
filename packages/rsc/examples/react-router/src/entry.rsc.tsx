import {
  createClientManifest,
  createServerManifest,
} from "@hiogawa/vite-rsc/core/server";
import {
  type DecodeCallServerFunction,
  type DecodeFormActionFunction,
  matchRSCServerRequest,
} from "react-router/rsc";
// @ts-ignore
import * as ReactServer from "react-server-dom-webpack/server.edge";

const routes = [
  {
    id: "root",
    children: [],
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

export async function callServer(request: Request) {
  const match = await matchRSCServerRequest({
    decodeCallServer,
    decodeFormAction,
    request,
    routes,
  });

  return new Response(
    ReactServer.renderToReadableStream(match.payload, createClientManifest),
    {
      status: match.statusCode,
      headers: match.headers,
    },
  );
}
