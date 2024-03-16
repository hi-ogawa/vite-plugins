import { viteDevServer } from "@hiogawa/vite-import-dev-server/runtime";

// wrapper to fix error.stack on dev server
export function logError(e: unknown) {
  if (e instanceof Error) {
    viteDevServer?.ssrFixStacktrace(e);
  }
  console.error(e);
}
