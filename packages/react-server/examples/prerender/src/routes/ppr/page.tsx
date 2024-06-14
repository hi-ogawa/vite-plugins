import { Postpone } from "@hiogawa/react-server/server";
import React from "react";

export default async function Page() {
  return (
    <div
      style={{
        border: "1px solid #00000030",
        padding: "1rem",
      }}
    >
      <h2>Static</h2>
      <pre style={{ whiteSpace: "wrap" }}>
        [rendered at {new Date().toISOString()}]
      </pre>
      <div
        style={{
          background: "#00ff0010",
          marginBottom: "1rem",
          height: "8rem",
          width: "100%",
          display: "grid",
          alignContent: "center",
        }}
      >
        <React.Suspense fallback={<div>Sleeping 1 sec ...</div>}>
          <Postpone>
            <Sleep id="1" ms={1000} />
          </Postpone>
        </React.Suspense>
      </div>
      <div
        style={{
          background: "#ff000010",
          height: "8rem",
          width: "100%",
          display: "grid",
          alignContent: "center",
        }}
      >
        <React.Suspense fallback={<div>Sleeping 2 sec ...</div>}>
          <Postpone>
            <Sleep id="2" ms={2000} />
          </Postpone>
        </React.Suspense>
      </div>
    </div>
  );
}

async function Sleep(props: { id: string; ms: number }) {
  await new Promise((r) => setTimeout(r, props.ms));

  return (
    <div>
      <h2>Dynamic {props.id}</h2>
      <pre style={{ whiteSpace: "wrap" }}>
        [rendered at {new Date().toISOString()}]
      </pre>
    </div>
  );
}
