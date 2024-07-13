// cf.
// https://github.com/vercel/next.js/blob/9c55b45fe06baa6240de35521fc43a33869bf041/packages/next/src/server/og/image-response.ts
// https://github.com/vercel/next-app-router-playground/blob/e9d64dd5018d5280fee725fd4d44ea90d66c75f7/app/api/og/route.tsx

export async function GET(request: Request) {
  const { ImageResponse } = await import("@vercel/og");

  const url = new URL(request.url);
  const title = url.searchParams.get("title") ?? "Hello!";
  return new ImageResponse(
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: "48px",
        fontWeight: "600",
      }}
    >
      {title}
    </div>,
    {
      width: 843,
      height: 441,
    },
  );
}
