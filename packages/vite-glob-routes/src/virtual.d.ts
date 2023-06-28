declare module "virtual:@hiogawa/vite-glob-routes/internal/page-routes" {
  const value: import("./react-router-utils").GlobPageRoutesInternal;
  export default value;
}

declare module "virtual:@hiogawa/vite-glob-routes/internal/api-routes" {
  const value: {
    root: string;
    globApi: Record<string, any>;
  };
  export default value;
}
