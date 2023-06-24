declare module "/virtual:@hiogawa/vite-index-html-middleware/internal" {
  const value: {
    server?: import("vite").ViteDevServer;
    importIndexHtml: () => Promise<{ default: string }>;
  };
  export default value;
}
