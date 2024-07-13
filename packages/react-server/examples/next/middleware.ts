import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  if (url.pathname == "/test-middleware") {
    return NextResponse.json({ hello: ["from", "middleware"] });
  }
  return NextResponse.next();
}
