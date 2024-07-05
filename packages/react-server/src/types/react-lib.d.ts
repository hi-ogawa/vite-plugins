declare module "react-dom/server.edge" {
  export * from "react-dom/server";

  // https://github.com/facebook/react/blob/fb57fc5a8a66f38d65e3bc9f83213a0003da5702/packages/react-dom/src/server/ReactDOMFizzServerEdge.js#L165
  export function resume(
    children: React.ReactNode,
    postponed: null | object,
    opitons?: import("react-dom/server").RenderToReadableStreamOptions,
  ): Promise<ReadableStream<Uint8Array>>;
}

// https://github.com/facebook/react/blob/fb57fc5a8a66f38d65e3bc9f83213a0003da5702/packages/react-dom/src/server/ReactDOMFizzStaticEdge.js#L63
declare module "react-dom/static.edge" {
  export function prerender(
    children: React.ReactNode,
    opitons?: import("react-dom/server").RenderToReadableStreamOptions,
  ): Promise<{
    postponed: null | object;
    prelude: ReadableStream<Uint8Array>;
  }>;
}

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightDOMServerEdge.js
declare module "react-server-dom-webpack/server.edge" {
  // TODO: branded stream type?
  export function renderToReadableStream<T>(
    node: T,
    bundlerConfig: import("./react").BundlerConfig,
    opitons?: {
      onError: import("react-dom/server").RenderToReadableStreamOptions["onError"];
    },
  ): ReadableStream<Uint8Array>;

  export function registerClientReference<T>(
    ref: T,
    id: string,
    name: string,
  ): T;

  export function registerServerReference<T>(
    ref: T,
    id: string,
    name: string,
  ): T;

  export function decodeReply(
    body: string | FormData,
    bundlerConfig: import("./react").BundlerConfig,
    // TODO: temporaryReferences
  ): Promise<unknown[]>;

  export function decodeAction(
    body: FormData,
    bundlerConfig: import("./react").BundlerConfig,
  ): Promise<() => Promise<unknown>>;

  export function decodeFormState(
    actionResult: unknown,
    body: FormData,
    serverManifest?: unknown,
  ): Promise<unknown>;
}

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightDOMClientEdge.js
declare module "react-server-dom-webpack/client.edge" {
  export function createServerReference(
    id: string,
    callServer: import("./react").CallServerCallback,
    encodeFormAction?: unknown,
  ): Function;

  export function createFromReadableStream<T>(
    stream: ReadableStream<Uint8Array>,
    options: {
      ssrManifest: import("./react").SsrManifest;
      // TODO
      // encodeFormAction
    },
  ): Promise<T>;
}

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightDOMClientBrowser.js
declare module "react-server-dom-webpack/client.browser" {
  export function createServerReference(
    id: string,
    callServer: import("./react").CallServerCallback,
    encodeFormAction?: unknown,
  ): Function;

  export function createFromReadableStream<T>(
    stream: ReadableStream<Uint8Array>,
    options?: {
      callServer?: import("./react").CallServerCallback;
    },
  ): Promise<T>;

  export function createFromFetch<T>(
    promiseForResponse: Promise<Response>,
    options?: {
      callServer?: import("./react").CallServerCallback;
    },
  ): Promise<T>;

  export function encodeReply(v: unknown[]): Promise<string | FormData>;
}
