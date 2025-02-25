import type { JSX } from "react/jsx-runtime";

// https://github.com/vercel/next.js/blob/c74f3f54b23b3fc47dc7e214a8949844257a734a/packages/next/src/build/webpack/loaders/next-app-loader.ts#L72
// https://github.com/vercel/next.js/blob/8f5f0ef141a907d083eedb7c7aca52b04f9d258b/packages/next/src/client/components/not-found-error.tsx#L34-L39
export function DefaultNotFoundPage(): JSX.Element {
  return (
    <>
      <div
        style={{
          fontFamily:
            'system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
          height: "100vh",
          display: "flex",
          placeContent: "center",
          placeItems: "center",
        }}
      >
        <div style={{ display: "flex", lineHeight: "50px" }}>
          <h1
            style={{
              margin: "0 20px 0 0",
              padding: "0 23px 0 0",
              fontSize: 24,
              fontWeight: 500,
              borderRight: "1px solid rgba(0, 0, 0, .3)",
            }}
          >
            404
          </h1>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 400,
            }}
          >
            This page could not be found.
          </h2>
        </div>
      </div>
    </>
  );
}
