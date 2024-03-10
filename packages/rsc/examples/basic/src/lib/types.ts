// cf.
// https://github.com/dai-shi/waku/blob/4d16c28a58204991de2985df0d202f21a48ae1f9/packages/waku/src/types.d.ts#L60-L65

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

export type WebpackRequire = (id: string) => PromiseLike<unknown>;
