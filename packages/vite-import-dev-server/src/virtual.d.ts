declare module "virtual:@hiogawa/vite-import-dev-server/internal" {
  const value: {
    server?: import("vite").ViteDevServer;
    importIndexHtmlRaw: () => Promise<{ default: string }>;
  };
  export default value;
}
