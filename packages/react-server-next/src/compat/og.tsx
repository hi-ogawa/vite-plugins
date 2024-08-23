import { tinyassert } from "@hiogawa/utils";
import type * as OgType from "@vercel/og";

// https://www.npmjs.com/package/@vercel/og
// https://github.com/vercel/next.js/blob/9c55b45fe06baa6240de35521fc43a33869bf041/packages/next/src/server/og/image-response.ts

export class ImageResponse extends Response {
  constructor(...args: ConstructorParameters<typeof OgType.ImageResponse>) {
    const body = new ReadableStream({
      async start(controller) {
        const ogModule = await import("@vercel/og");
        const response = new ogModule.ImageResponse(...args);
        tinyassert(response.body);
        for await (const chunk of response.body) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });
    const headers = new Headers(args[1]?.headers);
    headers.set("content-type", "image/png");
    if (!headers.has("cache-control")) {
      headers.set(
        "cache-control",
        process.env["NODE_ENV"] === "development"
          ? "no-cache, no-store"
          : "public, immutable, no-transform, max-age=31536000",
      );
    }
    super(body, { ...args[1], headers });
  }
}
