import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { type ServerMiddleware, type ServerRequest, serve } from "srvx";
import { serveStatic } from "srvx/static";

// pnpm build --base /custom/base/
// pnpm preview-custom --base /custom/base/

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      base: { type: "string", default: "/" },
      static: { type: "string", short: "s", default: "./dist/client" },
    },
    allowPositionals: true,
  });

  const ssrEntry = positionals[0];
  if (!ssrEntry) {
    console.error(
      "Usage: node preview.ts <ssr-entry> [--base <base>] [-s <static-dir>]",
    );
    process.exitCode = 1;
    return;
  }
  const base = values.base.endsWith("/") ? values.base : values.base + "/";
  const staticDir = values.static;

  // Import the SSR handler
  const entryURL = pathToFileURL(resolve(ssrEntry)).href;
  const entryModule = await import(entryURL);

  // Wrap serveStatic to handle base path
  const serveStaticWithBase = (
    staticDir: string,
    base: string,
  ): ServerMiddleware => {
    const staticMiddleware = serveStatic({ dir: staticDir });
    if (base === "/") {
      return staticMiddleware;
    }
    return (req, next) => {
      const url = new URL(req.url);
      if (url.pathname.startsWith(base)) {
        url.pathname = "/" + url.pathname.slice(base.length);
        const rebasedReq = new Request(url, req) as ServerRequest;
        return staticMiddleware(rebasedReq, next);
      }
      return next();
    };
  };

  const server = serve({
    ...entryModule.default,
    middleware: [serveStaticWithBase(staticDir, base)],
  });

  await server.ready();
}

main();
