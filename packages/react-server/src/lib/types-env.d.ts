declare module "react-dom/server.edge" {
  export * from "react-dom/server";
}

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightDOMServerEdge.js
declare module "react-server-dom-webpack/server.edge" {
  export function renderToReadableStream(
    node: React.ReactNode,
    bundlerConfig: import("./types").BundlerConfig,
    opitons?: {
      onError: import("react-dom/server").RenderToReadableStreamOptions["onError"];
    },
  ): ReadableStream<Uint8Array>;

  export function decodeReply(body: string | FormData): Promise<unknown>;
}

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightDOMClientEdge.js
declare module "react-server-dom-webpack/client.edge" {
  export function createFromReadableStream(
    stream: ReadableStream<Uint8Array>,
    options: {
      ssrManifest: import("./types").SsrManifest;
      // TODO
      // encodeFormAction
    },
  ): Promise<React.ReactNode>;
}

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightDOMClientBrowser.js
declare module "react-server-dom-webpack/client.browser" {
  export function createFromReadableStream(
    stream: ReadableStream<Uint8Array>,
    options?: {
      callServer?: import("./types").CallServerCallback;
    },
  ): Promise<React.ReactNode>;

  export function createFromFetch(
    promiseForResponse: Promise<Response>,
    options?: {
      callServer?: import("./types").CallServerCallback;
    },
  ): Promise<React.ReactNode>;

  export function encodeReply(
    v: unknown,
  ): Promise<string | URLSearchParams | FormData>;
}
