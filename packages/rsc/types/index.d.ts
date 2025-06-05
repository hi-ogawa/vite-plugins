import "./virtual.d.ts";

declare global {
  interface ImportMeta {
    readonly viteRsc: {
      resources: import("react").JSX.Element;
    };
  }
}
