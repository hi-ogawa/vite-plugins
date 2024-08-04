"use client";

export default function GlobalError() {
  return (
    <html>
      <body>
        <div
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            placeContent: "center",
            placeItems: "center",
            gap: "4px",
            fontSize: "16px",
          }}
        >
          <h1>Something went wrong. Please try it again later.</h1>
          <div style={{ fontSize: "14px" }}>
            Back to{" "}
            <a
              href="/"
              style={{
                textDecoration: "underline",
                textUnderlineOffset: "2px",
                color: "#3451b2",
              }}
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
