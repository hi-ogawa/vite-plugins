import type { IndexHtmlMiddleware } from "./runtime-internal";

export const indexHtmlMiddleware = (() => {
  throw new Error(
    "most likely @hiogawa/vite-index-html-middleware plugin is not configured properly."
  );
}) as IndexHtmlMiddleware;
