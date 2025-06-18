import "./virtual";

declare global {
  interface ImportMeta {
    readonly viteRsc: {
      loadCss: (importer?: string) => import("react").ReactNode;
      loadSsrModule: <T>(entry: string) => Promise<T>;
    };
  }
}

export {};
