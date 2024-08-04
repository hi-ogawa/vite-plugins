import type { ErrorPageProps } from "../../server";

// https://github.com/vercel/next.js/blob/677c9b372faef680d17e9ba224743f44e1107661/packages/next/src/build/webpack/loaders/next-app-loader.ts#L73
// https://github.com/vercel/next.js/blob/677c9b372faef680d17e9ba224743f44e1107661/packages/next/src/client/components/error-boundary.tsx#L145
export function DefaultGlobalErrorPage(props: ErrorPageProps) {
  const message = props.serverError
    ? `Unknown Server Error (see server logs for the details)`
    : "Unknown Client Error (see browser console for the detail)";
  return (
    <html>
      <title>{message}</title>
      <body
        style={{
          fontFamily:
            'system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          placeContent: "center",
          placeItems: "center",
          fontSize: "14px",
          fontWeight: 400,
          lineHeight: "28px",
        }}
      >
        <h2>{message}</h2>
      </body>
    </html>
  );
}
