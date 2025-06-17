import * as ReactServer from "@hiogawa/vite-rsc/rsc";
import type { ReactFormState } from "react-dom/client";
import { Root } from "../root.tsx";
import type { RenderHTML } from "./entry.ssr.tsx";

export type RscPayload = {
  root: React.ReactNode;
  returnValue?: unknown;
  formState?: ReactFormState;
};

async function handler(request: Request): Promise<Response> {
  // handle server function request
  const isAction = request.method === "POST";
  let returnValue: unknown | undefined;
  let formState: ReactFormState | undefined;
  let temporaryReferences: unknown | undefined;
  if (isAction) {
    // x-rsc-action header exists when action is called via `ReactClient.setServerCallback`.
    const actionId = request.headers.get("x-rsc-action");
    if (actionId) {
      const contentType = request.headers.get("content-type");
      const body = contentType?.startsWith("multipart/form-data")
        ? await request.formData()
        : await request.text();
      temporaryReferences = ReactServer.createTemporaryReferenceSet();
      const args = await ReactServer.decodeReply(body, { temporaryReferences });
      const action = await ReactServer.loadServerAction(actionId);
      returnValue = await action.apply(null, args);
    } else {
      // otherwise server function is called via `<form action={...}>`
      // before hydration (e.g. when javascript is disabled).
      // aka progressive enhancement.
      const formData = await request.formData();
      const decodedAction = await ReactServer.decodeAction(formData);
      const result = await decodedAction();
      formState = await ReactServer.decodeFormState(result, formData);
    }
  }

  // serialization from React VDOM tree to RSC stream.
  // we render RSC stream after handling server function request
  // so that new render reflects updated state from server function call
  // to achieve single round trip to mutate and fetch from server.
  const rscStream = ReactServer.renderToReadableStream<RscPayload>({
    // in this example, we always render the same `<Root />`
    root: <Root />,
    returnValue,
    formState,
  });

  // respond RSC stream without HTML rendering based on framework's convention.
  // here we use request header `content-type`.
  // additionally we allow `?__rsc` and `?__html` to easily view payload directly.
  const url = new URL(request.url);
  const isRscRequest =
    (!request.headers.get("accept")?.includes("text/html") &&
      !url.searchParams.has("__html")) ||
    url.searchParams.has("__rsc");

  if (isRscRequest) {
    return new Response(rscStream, {
      headers: {
        "content-type": "text/x-component;charset=utf-8",
        vary: "accept",
      },
    });
  }

  const renderHTML = await getRenderHTML(url.origin);
  const htmlStream = await renderHTML(rscStream, {
    formState,
    options: {
      // allow quick simulation of javscript disabled browser
      debugNojs: url.searchParams.has("__nojs"),
    },
  });

  // respond html
  return new Response(htmlStream, {
    headers: {
      "Content-type": "text/html",
      vary: "accept",
    },
  });
}

// delegate html rendering to ssr environment.
// how they are communicated differs between dev and build.
async function getRenderHTML(origin: string): Promise<RenderHTML> {
  // for build, ssr build is directly imported in the runtime.
  if (!import.meta.env.DEV) {
    const module = await import.meta.viteRsc.loadSsrModule<
      typeof import("./entry.ssr.tsx")
    >("index");
    return module.renderHTML;
  }

  // for dev, ssr environment runs on node and is proxied through special endpoint.
  // error handling is likely more complicated but that would be same for two workers setup.
  return async (rscStream, options) => {
    const proxyRequest = new Request(
      new URL("/__vite_rsc_render_html", origin),
      {
        method: "POST",
        body: rscStream,
        headers: {
          "x-vite-rsc-render-html": JSON.stringify(options),
        },
      },
    );
    const response = await fetch(proxyRequest);
    return response.body!;
  };
}

export default {
  fetch(request: Request) {
    return handler(request);
  },
};
