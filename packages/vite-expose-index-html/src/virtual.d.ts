declare module "virtual:@hiogawa/vite-expose-index-html/internal" {
  const value: {
    server?: import("vite").ViteDevServer;
    importIndexHtml: () => Promise<{ default: string }>;
  };
  export default value;
}
