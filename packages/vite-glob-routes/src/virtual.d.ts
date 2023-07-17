declare module "virtual:@hiogawa/vite-glob-routes/internal/pageRoutesServer" {
  const value: import("./react-router-utils").GlobPageRoutesInternal;
  export default value;
}

declare module "virtual:@hiogawa/vite-glob-routes/internal/pageRoutesClient" {
  const value: import("./react-router-utils").GlobPageRoutesInternal;
  export default value;
}

declare module "virtual:@hiogawa/vite-glob-routes/internal/pageRoutesClientLazy" {
  const value: import("./react-router-utils").GlobPageRoutesInternal;
  export default value;
}

declare module "virtual:@hiogawa/vite-glob-routes/internal/apiRoutes" {
  const value: {
    root: string;
    globApi: Record<string, any>;
  };
  export default value;
}
