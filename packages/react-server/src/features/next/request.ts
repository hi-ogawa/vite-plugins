// initial target is to support next-auth
// https://github.com/nextauthjs/next-auth/blob/a3d3d4bab3e037a5359ed22de8b1fff0b5557523/packages/next-auth/src/index.ts#L86
// https://github.com/nextauthjs/next-auth/blob/a3d3d4bab3e037a5359ed22de8b1fff0b5557523/packages/next-auth/src/lib/index.ts#L3

// https://github.com/vercel/next.js/blob/48f62e059317f78f07d71541a20e81d68f78e298/packages/next/src/server/web/spec-extension/request.ts
export class NextRequest extends Request {}

// https://github.com/vercel/next.js/blob/48f62e059317f78f07d71541a20e81d68f78e298/packages/next/src/server/web/spec-extension/response.ts
export class NextResponse extends Response {}
