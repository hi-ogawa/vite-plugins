// https://github.com/dai-shi/waku/blob/4d16c28a58204991de2985df0d202f21a48ae1f9/packages/waku/src/types.d.ts#L60-L65

declare module "react-dom/server.edge" {
  export * from "react-dom/server";
}

interface ImportManifestEntry {
  id: string;
  name: string;
  // TODO: what's this?
  chunks: string[];
}

declare module "react-server-dom-webpack/server.edge" {
  export interface BundlerConfig {
    [bundlerId: string]: ImportManifestEntry;
  }

  export function renderToReadableStream(
    node: React.ReactNode,
    bundlerConfig: BundlerConfig
  ): ReadableStream;
}

declare module "react-server-dom-webpack/client.edge" {
  export interface WebpackRequire {
    (id: string): Promise<any>;
  }

  export type ModuleMap = {
    [id: string]: {
      [exportName: string]: ImportManifestEntry;
    };
  };

  export function createFromReadableStream(
    stream: ReadableStream,
    options: {
      ssrManifest: {
        moduleMap: ModuleMap;
        moduleLoading: null;
      };
    }
  ): Promise<React.ReactNode>;
}

declare module "react-server-dom-webpack/client.browser" {
  export * from "react-server-dom-webpack/client.edge";
}
