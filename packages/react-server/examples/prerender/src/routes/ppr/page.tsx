import React from "react";

export default async function Page() {
  return (
    <div
      style={{
        border: "1px solid #0004",
        padding: "1rem",
        maxWidth: "30rem",
      }}
    >
      <div>Static</div>
      <pre style={{ whiteSpace: "wrap" }} data-testid="static-time">
        [rendered at {new Date().toISOString()}]
      </pre>
      <div
        style={{
          background: "#f002",
          padding: "1rem",
        }}
      >
        <React.Suspense fallback={<div>Sleeping 1 sec ...</div>}>
          <Sleep />
        </React.Suspense>
      </div>
    </div>
  );
}

async function Sleep() {
  if (globalThis.process?.env?.["REACT_SERVER_RENDER_MODE"] === "ppr") {
    // @ts-expect-error
    React.unstable_postpone();
  }

  await new Promise((r) => setTimeout(r, 1000));

  return (
    <>
      <div>Dynamic</div>
      <pre style={{ whiteSpace: "wrap" }} data-testid="dynamic-time">
        [rendered at {new Date().toISOString()}]
      </pre>
    </>
  );
}
