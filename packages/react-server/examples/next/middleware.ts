export function middleware(_request: Request) {
  return new Response("hello");
}

export const config = {
  matcher: "/about/:path*",
};
