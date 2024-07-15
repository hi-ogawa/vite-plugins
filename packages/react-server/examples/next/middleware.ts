import { redirect } from "@hiogawa/react-server/server";
import { type NextRequest, NextResponse } from "next/server";

export default function middleware(request: NextRequest) {
  const url = new URL(request.url);
  if (url.pathname == "/test/middleware/response") {
    return NextResponse.json({ hello: ["from", "middleware"] });
  }
  if (url.pathname == "/test/middleware/headers") {
    const response = NextResponse.next();
    response.headers.set("x-hello", "world");
    return response;
  }
  if (url.pathname == "/test/middleware/cookies") {
    const response = NextResponse.next();
    response.cookies.set("x-hello", "world");
    return response;
  }
  if (url.pathname == "/test/middleware/redirect") {
    return Response.redirect(new URL("/?ok=redirect", url));
  }
  return NextResponse.next();
}
