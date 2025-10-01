export type ImportAssetsOptions = {
  import?: string;
  environment?: string;
  // TODO
  // dev?: {
  //   eager: boolean;
  // };
  // build?: {
  //   addEntry: boolean;
  // };
};

export type ImportAssetsResult = {
  entry?: string;
  js: { href: string }[];
  css: CssLinkAttributes[];
};

type CssLinkAttributes = {
  href: string;
  "data-vite-dev-id"?: string;
};
