"use client";

import React from "react";

export function TestClient() {
  const [count, setCount] = React.useState(0);

  return React.createElement(
    "button",
    { onClick: () => setCount((v) => v + 1) },
    "TestDepMixed(Client): " + count,
  );
}
