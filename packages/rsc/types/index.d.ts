import "./virtual.d.ts";

declare global {
  interface ImportMeta {
    readonly viteRscCss: import("react").JSX.Element;
  }
}
