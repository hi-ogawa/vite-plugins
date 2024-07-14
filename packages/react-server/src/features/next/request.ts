import { RequestCookies, ResponseCookies } from "@edge-runtime/cookies";

// https://github.com/vercel/next.js/blob/48f62e059317f78f07d71541a20e81d68f78e298/packages/next/src/server/web/spec-extension/request.ts
export class NextRequest extends Request {
  cookies: RequestCookies;
  nextUrl: NextURL;

  constructor(...args: ConstructorParameters<typeof Request>) {
    super(...args);
    this.cookies = new RequestCookies(this.headers);
    this.nextUrl = new NextURL(this.url);
  }
}

// https://github.com/vercel/next.js/blob/48f62e059317f78f07d71541a20e81d68f78e298/packages/next/src/server/web/spec-extension/response.ts
export class NextResponse extends Response {
  cookies: ResponseCookies;

  constructor(...args: ConstructorParameters<typeof Response>) {
    super(...args);
    this.cookies = new ResponseCookies(this.headers);
  }

  /** @todo */
  static rewrite(..._args: unknown[]) {}

  static next(_options?: {
    request?: {
      /** @todo */
      headers?: Headers;
    };
  }) {
    return new NextResponse(null, {
      headers: {
        [MIDDLEWARE_NEXT_KEY]: "1",
      },
    });
  }
}

export const MIDDLEWARE_NEXT_KEY = "x-middleware-next";

class NextURL extends URL {
  clone() {
    return new NextURL(this);
  }
}

/** @todo */
export type NextFetchEvent = {
  waitUntil(promise: Promise<unknown>): void;
};
