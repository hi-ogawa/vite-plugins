export type ImportAssetsOptions = {
  import?: string;
  environment?: string;
  // TODO
  dev?: {
    eager: boolean;
  };
  build?: {
    addEntry: boolean;
  };
};

export type ImportAssetsResult = {
  entry?: string;
  js: string[];
  css: string[];
};
