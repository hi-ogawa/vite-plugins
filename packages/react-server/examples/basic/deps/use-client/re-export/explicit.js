import React from "react";

export function TestDepReExportExplicit() {
  const [count, setCount] = React.useState(0);
  return React.createElement(
    "button",
    { onClick: () => setCount((v) => v + 1) },
    `TestDepReExportExplicit: ${count}`,
  );
}
