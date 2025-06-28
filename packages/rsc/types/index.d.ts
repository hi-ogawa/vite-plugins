import "./virtual";

declare global {
  interface ImportMeta {
    readonly viteRsc: {
      loadCss: (importer?: string) => import("react").ReactNode;
      /** @deprecated use `loadModule("ssr", entry)` instead */
      loadSsrModule: <T>(entry: string) => Promise<T>;
      loadModule: <T>(environmentName: string, entryName: string) => Promise<T>;
      loadBootstrapScriptContent: (entryName: string) => Promise<string>;

      /**
       * https://github.com/vercel/next.js/blob/09a2167b0a970757606b7f91ff2d470f77f13f8c/packages/next/src/shared/lib/dynamic.tsx#L79
       * https://nextjs.org/docs/pages/guides/lazy-loading#nextdynamic
       */
      dynamic: <T>(loadFn: () => Promise<import("react").ReactNode>) => import("react").ReactNode;
    };
  }

  interface ImportMetaEnv {
    readonly __vite_rsc_build__: boolean;
  }
}

export {};
