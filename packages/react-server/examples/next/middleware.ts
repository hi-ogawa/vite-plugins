import { NextResponse } from "next/server";

export function middleware(request: Request) {
  const url = new URL(request.url);
  if (url.pathname == "/test-middleware") {
    return new Response("hello");
  }
  return NextResponse.next();
}
