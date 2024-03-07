// https://github.com/dai-shi/waku/blob/4d16c28a58204991de2985df0d202f21a48ae1f9/packages/waku/src/types.d.ts#L60-L65

declare module "react-dom/server.edge" {
  export * from "react-dom/server";
}

declare module "react-server-dom-webpack/server.edge" {
  export function renderToReadableStream(node: React.ReactNode): ReadableStream;
}

declare module "react-server-dom-webpack/client.edge" {
  export function createFromReadableStream(
    stream: ReadableStream,
    options: {
      ssrManifest: {
        moduleMap: null;
        moduleLoading: null;
      };
    }
  ): Promise<React.ReactNode>;
}

declare module "react-server-dom-webpack/client.browser" {
  export * from "react-server-dom-webpack/client.edge";
}
