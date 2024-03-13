// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightDOMServerEdge.js
declare module "react-server-dom-webpack/server.edge" {
  export function renderToReadableStream(
    node: React.ReactNode,
    bundlerConfig: import("./types").BundlerConfig,
    opitons?: {}
  ): ReadableStream;

  export function decodeReply(body: string | FormData): Promise<unknown>;
}
