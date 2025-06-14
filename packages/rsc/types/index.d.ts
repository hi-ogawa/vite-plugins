import "./virtual";

declare global {
  interface ImportMeta {
    readonly viteRsc: {
      loadCss: () => import("react").ReactNode;
      loadSsrModule: <T>(entry: string) => Promise<T>;
    };
  }
}

export {};
