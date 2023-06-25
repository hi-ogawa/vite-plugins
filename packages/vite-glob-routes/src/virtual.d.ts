declare module "virtual:@hiogawa/vite-glob-routes/internal/page-routes" {
  const value: {
    root: string;
    globPage: Record<string, any>;
    globPageServer: Record<string, any>;
    globLayout: Record<string, any>;
  };
  export default value;
}

declare module "virtual:@hiogawa/vite-glob-routes/internal/api-routes" {
  const value: {
    root: string;
    globApi: Record<string, any>;
  };
  export default value;
}
