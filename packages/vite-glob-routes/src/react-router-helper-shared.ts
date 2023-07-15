import { tinyassert } from "@hiogawa/utils";
import { type DataRouteMatch } from "react-router";
import type { RoutesMeta } from "./react-router-utils";
import { mapValues } from "./utils";

//
// server proxy loader convention (aka data request)
//

// special marker for server to differentiate direct loader request
const LODER_MARKER = "_data.json";

export function wrapLoaderRequest(req: Request): Request {
  const url = new URL(req.url);
  url.pathname += LODER_MARKER;
  return new Request(url);
}

export function unwrapLoaderRequest(req: Request): Request | undefined {
  const url = new URL(req.url);
  if (url.pathname.endsWith(LODER_MARKER)) {
    url.pathname = url.pathname.slice(0, -LODER_MARKER.length);
    return new Request(url, req);
  }
  return;
}

// TODO
// convention to wrap/unwrap response to propagate redirection/error on client
// e.g. x-loader-status, x-loader-redirect, etc...
// cf. https://github.com/remix-run/remix/blob/8268142371234795491070bafa23cd4607a36529/packages/remix-react/routes.tsx#L210

export function wrapLoaderResult(res: unknown): Response {
  tinyassert(res instanceof Response);
  return res;
}

export function unwrapLoaderResult(res: Response): unknown {
  return res;
}

//
// extra runtime route data to pass from server to client
// for complete SSR experience (which are not provided by react-router yet)
//

export interface ExtraRouterInfo {
  // need to resolve lazy route of initial routes before hydration on client (cf. initializeClientRoutes)
  matches: SerializedMatch[];
  // client can use this to auto inject `proxyServerLoader` for the page with server loader.
  // note that client cannot known this during "build" time since we build client before server.
  // also "file" mapping data will be needed to implement client-side link prefetching.
  routesMeta: SerializedRoutesMeta;
}

export const KEY_extraRouterInfo = "__globRoutes__ExtraRouterInfo";

type SerializedMatch = ReturnType<typeof serializeMatch>;

export function serializeMatch(match: DataRouteMatch) {
  return {
    route: {
      id: match.route.id,
    },
  };
}

type SerializedRoutesMeta = ReturnType<typeof serializeRoutesMata>;

export function serializeRoutesMata(routesMeta: RoutesMeta) {
  return mapValues(routesMeta, (v) => ({
    exports: Object.keys(v.route),
    entries: v.entries.map((e) => ({
      file: e.file,
      isServer: e.isServer,
    })),
  }));
}

//
// server handing-off data to client via global script
//

export function createGlobalScript(key: string, data: unknown) {
  // TODO: need more intricate escape? cf. https://github.com/remix-run/react-router/blob/5b1765f54ee1f769b23c4ded3ad02f04a34e636e/packages/react-router-dom/server.tsx#L120-L125
  return `<script>window.${key} = ${JSON.stringify(data)}</script>`;
}

export function getGlobalScriptData(key: string): unknown {
  tinyassert(typeof window !== "undefined");
  return (window as any)[key];
}
