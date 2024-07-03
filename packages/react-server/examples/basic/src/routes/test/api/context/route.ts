import { cookies } from "@hiogawa/react-server/server";

const name = "api-test";

export async function GET() {
  return Response.json({
    cookie: cookies().get(name)?.value,
    route: "/test/api/context",
    method: "GET",
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  cookies().set(name, String(formData.get("value")));
  return Response.json({
    cookie: cookies().get(name)?.value,
    route: "/test/api/context",
    method: "POST",
  });
}
