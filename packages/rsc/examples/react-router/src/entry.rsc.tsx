import {
  createTemporaryReferenceSet,
  decodeAction,
  decodeReply,
  importSsr,
  initialize,
  loadServerAction,
  renderToReadableStream,
} from "@hiogawa/vite-rsc/rsc";
import {
  type DecodeCallServerFunction,
  type DecodeFormActionFunction,
  type ServerRouteObject,
  matchRSCServerRequest,
} from "react-router/rsc";

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

// @ts-ignore
const decodeCallServer: DecodeCallServerFunction = async (actionId, reply) => {
  const args = await decodeReply(reply);
  const action = await loadServerAction(actionId);
  return action.bind(null, ...args);
};

const decodeFormAction: DecodeFormActionFunction = async (formData) => {
  return await decodeAction(formData);
};

async function callServer(request: Request) {
  const temporaryReferences = createTemporaryReferenceSet();

  const match = await matchRSCServerRequest({
    decodeCallServer: async (actionId, reply) => {
      const args = await decodeReply(reply, { temporaryReferences });
      const action = await loadServerAction(actionId);
      return action.bind(null, ...args);
    },
    decodeFormAction,
    request,
    routes,
  });

  return new Response(
    renderToReadableStream(match.payload, { temporaryReferences }),
    {
      status: match.statusCode,
      headers: match.headers,
    },
  );
}

export default async function handler(requrest: Request) {
  const ssr = await importSsr<typeof import("./entry.ssr")>();
  return ssr.default(requrest, callServer);
}
