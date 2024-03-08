export interface ImportManifestEntry {
  id: string;
  name: string;
  // TODO: what's this?
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
  moduleLoading: null;
}

export type WebpackRequire = (id: string) => Promise<any>;
