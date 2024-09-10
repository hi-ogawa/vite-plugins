import { serveDir, serveFile } from "jsr:@std/http/file-server";
import { handler } from "../../dist/server/index.js";

Deno.serve(async (request) => {
  // https://jsr.io/@std/http/doc/file-server/~
  const url = new URL(request.url);
  if (url.pathname.startsWith("/assets/")) {
    return serveDir(request, {
      fsRoot: "dist/client",
      showIndex: false,
      headers: [`cache-control: public, immutable, max-age=31536000`],
    });
  }
  if (url.pathname === "/favicon.ico") {
    return serveFile(request, "dist/client/favicon.ico");
  }
  return handler(request);
});
