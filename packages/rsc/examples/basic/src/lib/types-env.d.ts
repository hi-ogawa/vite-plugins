declare module "react-dom/server.edge" {
  export * from "react-dom/server";
}

declare module "react-server-dom-webpack/server.edge" {
  export function renderToReadableStream(
    node: React.ReactNode,
    bundlerConfig: import("./types").BundlerConfig,
    opitons?: {}
  ): ReadableStream;
}

declare module "react-server-dom-webpack/client.edge" {
  export function createFromReadableStream(
    stream: ReadableStream,
    options: {
      ssrManifest: import("./types").SsrManifest;
    }
  ): Promise<React.ReactNode>;
}

declare module "react-server-dom-webpack/client.browser" {
  export * from "react-server-dom-webpack/client.edge";
}
