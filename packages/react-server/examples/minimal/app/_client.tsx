"use client";

import React from "react";

export function TestClient() {
  const [count, setCount] = React.useState(0);

  return <button onClick={() => setCount(count + 1)}>Client: {count}</button>;
}

export function SsrOnly(props: React.PropsWithChildren) {
  return import.meta.env.SSR ? <>{props.children}</> : null;
}
