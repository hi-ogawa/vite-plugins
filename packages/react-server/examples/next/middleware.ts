// https://nextjs.org/docs/app/api-reference/file-conventions/middleware

// TODO
// - server request interception
// - matcher
// - NextResponse.next
// - NextRequest

export function middleware(_request: Request) {
  return new Response("hello");
}

export const config = {
  matcher: "/about/:path*",
};
