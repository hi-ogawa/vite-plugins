import { Plugin } from "vite";

export function indexHtmlMiddleware(): Plugin {
  return {
    name: "@hiogawa/vite-index-html-middleware",
  };
}
