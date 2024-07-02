export async function GET(request: Request, context: unknown) {
  return Response.json({
    route: "/test/api/dynamic/[id]",
    method: "GET",
    pathname: new URL(request.url).pathname,
    context,
  });
}

export async function POST(request: Request, context: unknown) {
  return Response.json({
    route: "/test/api/dynamic/[id]",
    method: "POST",
    pathname: new URL(request.url).pathname,
    text: await request.text(),
    context,
  });
}
