import { ImageResponse } from "next/og";

// cf.
// https://github.com/vercel/next-app-router-playground/blob/e9d64dd5018d5280fee725fd4d44ea90d66c75f7/app/api/og/route.tsx

export async function GET(request: Request) {
  const url = new URL(request.url);
  const title = url.searchParams.get("title") ?? "Test";
  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#171717",
        backgroundColor: "#ffffff",
        width: "100%",
        height: "100%",
      }}
    >
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
      </div>
    </div>,
    {
      width: 843,
      height: 441,
    },
  );
}
