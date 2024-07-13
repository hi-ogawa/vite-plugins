import { RequestCookies, ResponseCookies } from "@edge-runtime/cookies";

// https://github.com/vercel/next.js/blob/48f62e059317f78f07d71541a20e81d68f78e298/packages/next/src/server/web/spec-extension/request.ts
export class NextRequest extends Request {
  cookies: RequestCookies;

  constructor(...args: ConstructorParameters<typeof Request>) {
    super(...args);
    this.cookies = new RequestCookies(this.headers);
  }
}

// https://github.com/vercel/next.js/blob/48f62e059317f78f07d71541a20e81d68f78e298/packages/next/src/server/web/spec-extension/response.ts
export class NextResponse extends Response {
  cookies: ResponseCookies;

  constructor(...args: ConstructorParameters<typeof Response>) {
    super(...args);
    this.cookies = new ResponseCookies(this.headers);
  }

  static next() {
    return new NextResponse(null, {
      headers: {
        [NEXT_RESPONSE_KEY]: "1",
      },
    });
  }
}

export const NEXT_RESPONSE_KEY = "x-middleware-next";
