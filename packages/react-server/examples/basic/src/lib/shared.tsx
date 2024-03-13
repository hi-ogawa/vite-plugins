import { tinyassert } from "@hiogawa/utils";
import type { CallServerCallback } from "./types";

const RSC_PARAM = "__rsc";

export function wrapRscRequestUrl(url: string): string {
  const newUrl = new URL(url, window.location.href);
  newUrl.searchParams.set(RSC_PARAM, "1");
  return newUrl.toString();
}

export function unwrapRscRequest(request: Request): Request | undefined {
  const url = new URL(request.url);
  if (url.searchParams.has(RSC_PARAM)) {
    url.searchParams.delete(RSC_PARAM);
    return new Request(url, {
      method: request.method,
      headers: request.headers,
    });
  }
  return;
}

const ACTION_ID = "x-actioin-id";

export function wrapActionRequest(
  url: string,
  id: string,
  body: BodyInit,
): Request {
  return new Request(wrapRscRequestUrl(url), {
    method: "POST",
    body,
    headers: {
      [ACTION_ID]: id,
    },
  });
}

export function unwrapActionRequest(request: Request) {
  const id = request.headers.get(ACTION_ID);
  if (id && request.method === "POST") {
    return { request, id };
  }
  return;
}

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightWebpackReferences.js#L87
// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-client/src/ReactFlightReplyClient.js#L671-L678
export function createServerReference(id: string): React.FC {
  return Object.defineProperties(
    (...args: unknown[]) => {
      const callServer: CallServerCallback = (globalThis as any).__callServer;
      tinyassert(callServer);
      return callServer(id, args);
    },
    {
      $$typeof: {
        value: Symbol.for("react.server.reference"),
      },
      $$id: {
        value: id,
        configurable: true,
      },
      $$bound: { value: null, configurable: true },
      // TODO: progressive enhancement?
      // https://github.com/facebook/react/pull/26774
      $$FORM_ACTION: {
        value: (name: string) => {
          return {
            name,
            method: "POST",
            encType: "multipart/form-data",
            data: new FormData(),
          };
        },
      },
      bind: {
        value: () => {
          throw new Error("todo: createServerReference.bind");
        },
        configurable: true,
      },
    },
  ) as any;
}

// TODO: refactor with createServerReference
export function createServerReferenceForRsc(
  id: string,
  action: Function,
): React.FC {
  return Object.defineProperties(action, {
    $$typeof: {
      value: Symbol.for("react.server.reference"),
    },
    $$id: {
      value: id,
      configurable: true,
    },
    $$bound: { value: null, configurable: true },
    // TODO: progressive enhancement?
    // https://github.com/facebook/react/pull/26774
    $$FORM_ACTION: {
      value: (name: string) => {
        return {
          name,
          method: "POST",
          encType: "multipart/form-data",
          data: new FormData(),
        };
      },
    },
    bind: {
      value: () => {
        throw new Error("todo: createServerReference.bind");
      },
      configurable: true,
    },
  }) as any;
}
