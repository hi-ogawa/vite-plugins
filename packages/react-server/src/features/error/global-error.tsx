"use client";

import type { ErrorPageProps } from "../../server";
import { getStatusText } from "./shared";

// https://github.com/vercel/next.js/blob/677c9b372faef680d17e9ba224743f44e1107661/packages/next/src/build/webpack/loaders/next-app-loader.ts#L73
// https://github.com/vercel/next.js/blob/677c9b372faef680d17e9ba224743f44e1107661/packages/next/src/client/components/error-boundary.tsx#L145
export function DefaultGlobalErrorPage(props: ErrorPageProps) {
  const status = props.serverError?.status;
  const message = status
    ? `${status} ${getStatusText(status)}`
    : "Unknown Error";

  return (
    <html>
      <title>{message}</title>
      <body>
        <h1>{message}</h1>
        <div>
          Back to <a href="/">Home</a>
        </div>
      </body>
    </html>
  );
}
