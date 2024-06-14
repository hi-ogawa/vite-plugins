import { Postpone } from "@hiogawa/react-server/server";
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
      <pre style={{ whiteSpace: "wrap" }}>
        [rendered at {new Date().toISOString()}]
      </pre>
      <div
        style={{
          background: "#f002",
          padding: "1rem",
          height: "5rem",
        }}
      >
        <React.Suspense fallback={<div>Sleeping 1 sec ...</div>}>
          <Postpone>
            <Sleep />
          </Postpone>
        </React.Suspense>
      </div>
    </div>
  );
}

async function Sleep() {
  await new Promise((r) => setTimeout(r, 1000));

  return (
    <>
      <div>Dynamic</div>
      <pre style={{ whiteSpace: "wrap" }}>
        [rendered at {new Date().toISOString()}]
      </pre>
    </>
  );
}
