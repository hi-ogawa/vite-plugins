import { type Result, tinyassert, typedBoolean } from "@hiogawa/utils";
import { type DataRouteMatch } from "react-router";
import type { Manifest } from "vite";
import type { RoutesMeta } from "./react-router-utils";
import { mapValues } from "./utils";

//
// server proxy loader convention (aka data request)
//

// special marker for server to tell loader request routeId cf. https://github.com/remix-run/remix/blob/c858f53e5a67fb293baf79a8de00c418903bc250/packages/remix-react/routes.tsx#L210
// I don't feel this convention is DX friendly since request path doesn't tell which loader is called exactly
const LOADER_ROUTE_ID = "_data";

export function wrapLoaderRequest(req: Request, routeId: string): Request {
  const url = new URL(req.url);
  url.searchParams.set(LOADER_ROUTE_ID, routeId);
  return new Request(url);
}

export function unwrapLoaderRequest(
  req: Request
): { request: Request; routeId: string } | undefined {
  const url = new URL(req.url);
  const routeId = url.searchParams.get(LOADER_ROUTE_ID);
  if (routeId) {
    url.searchParams.delete(LOADER_ROUTE_ID);
    return {
      request: new Request(url, req),
      routeId,
    };
  }
  return;
}

// redirect response
const LOCATION = "location";
const LOADER_REDIRECT_URL = "x-loader-redirect-url";
const LOADER_REDIRECT_STATUS = "x-loader-redirect-status";

// error `Response`
const LOADER_ERROR_RESPONSE = "x-loader-error-response"; // aka x-remix-catch

// exception (to propagate runtime `Error` to client)
const LOADER_EXCEPTION = "x-loader-exception"; // aka x-remix-error

// cf. https://github.com/remix-run/remix/blob/c858f53e5a67fb293baf79a8de00c418903bc250/packages/remix-server-runtime/server.ts#L127
export function wrapLoaderResult(result: Result<unknown, unknown>): Response {
  try {
    return wrapLoaderResultInner(result);
  } catch (e) {
    return wrapLoaderException(e);
  }
}

function wrapLoaderResultInner(result: Result<unknown, unknown>): Response {
  // note that "thrown redirect response" is already caught in `handler.queryRoute`
  // https://github.com/remix-run/react-router/blob/4e12473040de76abf26e1374c23a19d29d78efc0/packages/router/router.ts#L2748-L2764

  // exception or error response
  if (!result.ok) {
    const res = result.value;
    // exception
    if (!(res instanceof Response)) {
      throw res instanceof Error
        ? res
        : new Error("loader must throw 'Response' or 'Error'");
    }
    // error response
    res.headers.set(LOADER_ERROR_RESPONSE, "1");
    return res;
  }

  const res = result.value;
  tinyassert(res instanceof Response, "loader must return 'Response'");

  // redirect response
  if ([301, 302, 303, 307, 308].includes(res.status)) {
    const headers = new Headers(res.headers);
    const location = headers.get(LOCATION);
    tinyassert(location);
    headers.delete(LOCATION);
    headers.set(LOADER_REDIRECT_URL, location);
    headers.set(LOADER_REDIRECT_STATUS, String(res.status));
    return new Response(null, {
      status: 204,
      headers,
    });
  }

  return res;
}

// cf. https://github.com/remix-run/remix/blob/8268142371234795491070bafa23cd4607a36529/packages/remix-react/routes.tsx#L210
export async function unwrapLoaderResult(res: Response): Promise<Response> {
  // exception
  if (res.headers.get(LOADER_EXCEPTION)) {
    throw await unwrapLoaderException(res);
  }

  // error response
  if (res.headers.get(LOADER_ERROR_RESPONSE)) {
    throw res;
  }

  // redirect
  const redirectUrl = res.headers.get(LOADER_REDIRECT_URL);
  if (redirectUrl) {
    const headers = new Headers(res.headers);
    const redirectStatus = headers.get(LOADER_REDIRECT_STATUS);
    tinyassert(redirectStatus);
    headers.delete(LOADER_REDIRECT_URL);
    headers.delete(LOADER_REDIRECT_STATUS);
    headers.set(LOCATION, redirectUrl);
    return new Response(null, {
      status: Number(redirectStatus),
      headers,
    });
  }

  return res;
}

function wrapLoaderException(e: unknown) {
  const error =
    e instanceof Error ? e : new Error("unknown loader request exception");
  if (import.meta.env.PROD) {
    error.stack = `${String(error)} [STACK REDUCTED]`;
  }
  return new Response(
    JSON.stringify({
      message: error.message,
      stack: error.stack,
    }),
    {
      status: 500,
      headers: {
        [LOADER_EXCEPTION]: "1",
        "content-type": "application/json",
      },
    }
  );
}

async function unwrapLoaderException(res: Response) {
  return Object.assign(new Error(), await res.json());
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
  // for release build, extra mapping is required e.g. for link prefetching.
  // (TODO: technically such mapping can be done only once on server, so passing whole manifest is not necessary.)
  manifest?: Manifest;
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

//
// asset prefetching
//

export function getPreloadLink(href: string) {
  return `<link rel="modulepreload" href="${href}" />`;
}

export function resolveAssetPathsByRouteId(
  routeId: string,
  extraRouterInfo: ExtraRouterInfo
) {
  const { routesMeta, manifest } = extraRouterInfo;

  let files =
    routesMeta[routeId]?.entries
      .map((e) => !e.isServer && e.file)
      .filter(typedBoolean) ?? [];

  if (manifest) {
    files = resolveManifestAssets(files, manifest);
  }

  return files;
}

// general vite manifest utility to map production asset
function resolveManifestAssets(files: string[], manifest: Manifest) {
  const entryKeys = new Set<string>();

  function collectEnryKeysRecursive(key: string) {
    if (!entryKeys.has(key)) {
      const e = manifest[key];
      tinyassert(e);
      entryKeys.add(key);
      for (const nextKey of e.imports ?? []) {
        collectEnryKeysRecursive(nextKey);
      }
    }
  }

  for (const file of files) {
    // strip "/"
    collectEnryKeysRecursive(file.slice(1));
  }

  return [...entryKeys].map((key) => "/" + manifest[key]!.file);
}
