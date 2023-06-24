import type { IndexHtmlMiddleware } from "./internal";

export const indexHtmlMiddleware = (() => {
  throw new Error(
    "@hiogawa/vite-index-html-middleware plugin might not be configured properly"
  );
}) as IndexHtmlMiddleware;
