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
      },
    });
    const headers = new Headers(args[1]?.headers);
    headers.set("content-type", "image/png");
    super(body, { ...args[1], headers });
  }
}
