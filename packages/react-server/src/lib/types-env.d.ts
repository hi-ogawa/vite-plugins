declare module "react-dom/server.edge" {
  export * from "react-dom/server";
}

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightDOMServerEdge.js
declare module "react-server-dom-webpack/server.edge" {
  // TODO: branded stream type?
  export function renderToReadableStream<T>(
    node: T,
    bundlerConfig: import("./types").BundlerConfig,
    opitons?: {
      onError: import("react-dom/server").RenderToReadableStreamOptions["onError"];
    },
  ): ReadableStream<Uint8Array>;

  export function decodeReply(body: FormData): Promise<unknown[]>;

  export function decodeAction(
    body: FormData,
    bundlerConfig: import("./types").BundlerConfig,
  ): Promise<() => Promise<unknown>>;
}

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightDOMClientEdge.js
declare module "react-server-dom-webpack/client.edge" {
  export function createServerReference(
    id: string,
    callServer: import("./types").CallServerCallback,
    encodeFormAction?: unknown,
  ): Function;

  export function createFromReadableStream<T>(
    stream: ReadableStream<Uint8Array>,
    options: {
      ssrManifest: import("./types").SsrManifest;
      // TODO
      // encodeFormAction
    },
  ): Promise<T>;
}

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightDOMClientBrowser.js
declare module "react-server-dom-webpack/client.browser" {
  export function createServerReference(
    id: string,
    callServer: import("./types").CallServerCallback,
    encodeFormAction?: unknown,
  ): Function;

  export function createFromReadableStream<T>(
    stream: ReadableStream<Uint8Array>,
    options?: {
      callServer?: import("./types").CallServerCallback;
    },
  ): Promise<T>;

  export function createFromFetch<T>(
    promiseForResponse: Promise<Response>,
    options?: {
      callServer?: import("./types").CallServerCallback;
    },
  ): Promise<T>;

  export function encodeReply(v: unknown[]): Promise<FormData>;
}
