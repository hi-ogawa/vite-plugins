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

// TODO: do we ever need <style> instead of <link>?
// (assuming we land or patch this https://github.com/vitejs/vite/pull/20767)
type CssLinkAttributes = {
  href: string;
  "data-vite-dev-id"?: string;
};
