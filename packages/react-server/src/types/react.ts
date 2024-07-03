// cf.
// https://github.com/dai-shi/waku/blob/4d16c28a58204991de2985df0d202f21a48ae1f9/packages/waku/src/types.d.ts#L60-L65
// https://github.com/facebook/react/blob/706d95f486fbdec35b771ea4aaf3e78feb907249/packages/react-server-dom-webpack/src/shared/ReactFlightImportMetadata.js
// https://github.com/facebook/react/blob/706d95f486fbdec35b771ea4aaf3e78feb907249/packages/react-server-dom-webpack/src/ReactFlightClientConfigBundlerWebpack.js

export interface ImportManifestEntry {
  id: string;
  name: string;
  // TODO
  chunks: string[];
}

export interface BundlerConfig {
  [bundlerId: string]: ImportManifestEntry;
}

export type ModuleMap = {
  [id: string]: {
    [exportName: string]: ImportManifestEntry;
  };
};

export interface SsrManifest {
  moduleMap: ModuleMap;
  // TODO
  moduleLoading: null;
}

export type WebpackRequire = (id: string) => Promise<unknown>;

// TODO
export type WebpackChunkLoad = (id: string) => Promise<unknown>;

export type CallServerCallback = (id: any, args: any) => Promise<unknown>;
