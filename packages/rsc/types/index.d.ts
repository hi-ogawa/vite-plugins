import "./virtual";

declare global {
  interface ImportMeta {
    readonly viteRsc: {
      loadCss: (importer?: string) => import("react").ReactNode;
      loadModule: <T>(environmentName: string, entryName: string) => Promise<T>;
    };
  }
}

export {};
