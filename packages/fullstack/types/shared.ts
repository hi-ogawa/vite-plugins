// TODO: probably we can narrow the use cases to simply the API:
//
// 1. assets({ import: "..", clientEntry: true }) => entry, js, css
// - server entry referencing client entry
// - client only island
//
// 2. assets({ import: "..", universal: true }) => js, css
// - universal route
//
// 3. assets({ import: ".." }) => css
// - css assets for server only route
//
export type ImportAssetsOptions = {
  import?: string;
  environment?: string; // TODO: can remove?
  universal?: boolean;
  clientEntry?: boolean; // TODO: dynamically add entry during build
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
