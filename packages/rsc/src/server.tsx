import { memoize, tinyassert } from "@hiogawa/utils";
import type { ReactFormState } from "react-dom/client";
import ReactServer from "react-server-dom-webpack/server.edge";
import type { BundlerConfig, ImportManifestEntry } from "./types";

export type RscPayload = {
  root: React.ReactNode;
  formState?: ReactFormState;
  returnValue?: unknown;
};

// TODO: split helpers like parcel (callAction, renderRsc, renderHtml)
export async function renderRequest(
  request: Request,
  root: React.ReactNode,
): Promise<Response> {
  initializeReactServer();

  const url = new URL(request.url);
  const isAction = request.method === "POST";

  // use ?__rsc and ?__html for quick debugging
  const isRscRequest =
    (!request.headers.get("accept")?.includes("text/html") &&
      !url.searchParams.has("__html")) ||
    url.searchParams.has("__rsc");

  // callAction
  let returnValue: unknown | undefined;
  let formState: ReactFormState | undefined;
  if (isAction) {
    const actionId = request.headers.get("x-rsc-action");
    if (actionId) {
      // client stream request
      const contentType = request.headers.get("content-type");
      const body = contentType?.startsWith("multipart/form-data")
        ? await request.formData()
        : await request.text();
      const args = await ReactServer.decodeReply(body);
      const action = await importServerAction(actionId);
      returnValue = await action.apply(null, args);
    } else {
      // progressive enhancement
      const formData = await request.formData();
      const decodedAction = await ReactServer.decodeAction(
        formData,
        createActionBundlerConfig(),
      );
      const result = await decodedAction();
      formState = await ReactServer.decodeFormState(result, formData);
    }
  }

  const stream = ReactServer.renderToReadableStream<RscPayload>(
    { root, formState, returnValue },
    createBundlerConfig(),
  );

  if (isRscRequest) {
    return new Response(stream, {
      headers: {
        "content-type": "text/x-component;charset=utf-8",
      },
    });
  }

  const ssrEntry = await importSsrEntry();
  return ssrEntry.renderHtml(stream);
}

async function importSsrEntry(): Promise<typeof import("./ssr")> {
  if (import.meta.env.DEV) {
    return await __viteRscSsrRunner.import("virtual:vite-rsc/ssr-entry");
  } else {
    return await import("virtual:vite-rsc/build-ssr-entry" as any);
  }
}

//
// client reference manifest
//

function createBundlerConfig(): BundlerConfig {
  return new Proxy(
    {},
    {
      get(_target, $$id, _receiver) {
        tinyassert(typeof $$id === "string");
        let [id, name] = $$id.split("#");
        tinyassert(id);
        tinyassert(name);
        return {
          id,
          name,
          // TODO: preinit not working?
          // `ReactDOMSharedInternals.d.X` seems no-op due to null request context
          // even if we inject AsyncLocalStorage global for edge build?
          chunks: [id, id],
          async: true,
        } satisfies ImportManifestEntry;
      },
    },
  );
}

//
// server reference manifest
//

async function importServerAction(id: string): Promise<Function> {
  const [file, name] = id.split("#") as [string, string];
  const mod: any = await importServerReference(file);
  return mod[name];
}

async function importServerReference(id: string): Promise<unknown> {
  if (import.meta.env.DEV) {
    return import(/* @vite-ignore */ id);
  } else {
    const references = await import(
      "virtual:vite-rsc/server-references" as string
    );
    const dynImport = references.default[id];
    tinyassert(dynImport, `server reference not found '${id}'`);
    return dynImport();
  }
}

function createActionBundlerConfig(): BundlerConfig {
  return new Proxy(
    {},
    {
      get(_target, $$id, _receiver) {
        tinyassert(typeof $$id === "string");
        let [id, name] = $$id.split("#");
        tinyassert(id);
        tinyassert(name);
        return {
          id,
          name,
          chunks: [],
          async: true,
        } satisfies ImportManifestEntry;
      },
    },
  );
}

let init = false;
function initializeReactServer(): void {
  if (init) return;
  init = true;

  Object.assign(globalThis, {
    __vite_react_server_webpack_require__: memoize(importServerReference),
    __vite_react_server_webpack_chunk_load__: () => {
      throw new Error("__webpack_chunk_load__");
    },
  });
}
