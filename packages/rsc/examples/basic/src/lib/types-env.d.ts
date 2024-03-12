declare module "react-dom/server.edge" {
  export * from "react-dom/server";
}

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightDOMServerEdge.js#L23-L34
declare module "react-server-dom-webpack/server.edge" {
  export function renderToReadableStream(
    node: React.ReactNode,
    bundlerConfig: import("./types").BundlerConfig,
    opitons?: {}
  ): ReadableStream;

  // TODO
  export function decodeReply() {}
}

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightDOMClientEdge.js#L18
declare module "react-server-dom-webpack/client.edge" {
  export function createFromReadableStream(
    stream: ReadableStream,
    options: {
      ssrManifest: import("./types").SsrManifest;
    }
  ): Promise<React.ReactNode>;
}

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightDOMClientBrowser.js#L87-L96
declare module "react-server-dom-webpack/client.browser" {
  export function createFromReadableStream(
    stream: ReadableStream,
    options?: {
      callServer?: import("./types").CallServerCallback;
    }
  ): Promise<React.ReactNode>;

  export function createFromFetch(
    promiseForResponse: Promise<Response>,
    options?: {
      callServer?: import("./types").CallServerCallback;
    }
  ): Promise<React.ReactNode>;

  // TODO
  export function encodeReply(v: unknown): Promise<unknown>;
}
