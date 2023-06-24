declare module "virtual:@hiogawa/vite-index-html-middleware/internal/page-routes" {
  const value: {
    root: string;
    globPage: Record<string, any>;
    globLayout: Record<string, any>;
  };
  export default value;
}

declare module "virtual:@hiogawa/vite-index-html-middleware/internal/api-routes" {
  const value: {
    root: string;
    globApi: Record<string, any>;
  };
  export default value;
}
