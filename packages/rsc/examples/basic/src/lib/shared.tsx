import { tinyassert } from "@hiogawa/utils";
import type { ImportManifestEntry, ModuleMap } from "./types";

export const moduleMap: ModuleMap = new Proxy(
  {},
  {
    get(_target, id, _receiver) {
      return new Proxy(
        {},
        {
          get(_target, name, _receiver) {
            tinyassert(typeof id === "string");
            tinyassert(typeof name === "string");
            return {
              id,
              name,
              chunks: [],
            } satisfies ImportManifestEntry;
          },
        }
      );
    },
  }
);

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
    return new Request(url, request);
  }
  return;
}

const RENDER_ID_SEP = "?__renderId=";

export function wrapRenderId(id: string, tag: string) {
  if (import.meta.env.DEV) {
    return `${id}${RENDER_ID_SEP}${tag}`;
  }
  return id;
}

export function unwrapRenderId(id: string) {
  return id.split(RENDER_ID_SEP) as [string, string];
}

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightWebpackReferences.js#L87
// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-client/src/ReactFlightReplyClient.js#L671-L678
export function createServerReference(id: string): React.FC {
  return Object.defineProperties(
    () => {
      console.log("todo: createServerReference.callServer");
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
    }
  ) as any;
}
