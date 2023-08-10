declare module "virtual:@hiogawa/vite-import-index-html/internal" {
  const value: {
    server?: import("vite").ViteDevServer;
    importIndexHtmlRaw: () => Promise<{ default: string }>;
  };
  export default value;
}
