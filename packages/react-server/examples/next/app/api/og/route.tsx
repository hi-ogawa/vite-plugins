import { ImageResponse } from "@vercel/og";

// https://github.com/vercel/next.js/blob/9c55b45fe06baa6240de35521fc43a33869bf041/packages/next/src/server/og/image-response.ts

export function GET() {
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
      Hello!
    </div>,
    {
      width: 843,
      height: 441,
    },
  );
}
