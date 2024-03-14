import { tinyassert } from "@hiogawa/utils";
import type { CallServerCallback } from "./types";

// TODO: organize

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

// TODO
// it doesn't seem like a right way to do progressive enhancement for SSR
// but works okay for simple cases? (e.g. no `bind`?)
// cf. https://github.com/facebook/react/pull/26774
const ACTION_ID_PREFIX = "$ACTION_ID_";

function injectActionId(formData: FormData, id: string) {
  formData.set(ACTION_ID_PREFIX + id, "");
}

export function ejectActionId(formData: FormData) {
  let id: string | undefined;
  formData.forEach((_v, k) => {
    if (k.startsWith(ACTION_ID_PREFIX)) {
      id = k.slice(ACTION_ID_PREFIX.length);
      formData.delete(k);
    }
  });
  tinyassert(id);
  return id;
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
      $$FORM_ACTION: {
        value: (name: string) => {
          console.log("[createServerReference]", { id, name });
          const data = new FormData();
          injectActionId(data, id);
          return {
            name,
            method: "POST",
            encType: "multipart/form-data",
            data,
          };
        },
      },
      bind: {
        value: () => {
          throw new Error("todo: createServerReference.bind");
        },
        configurable: true,
      },
    }
  ) as any;
}

// TODO: refactor with createServerReference
export function createServerReferenceForRsc(
  id: string,
  action: Function
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
