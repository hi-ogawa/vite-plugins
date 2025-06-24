"use client";

import React from "react";
import { changeCounter, getCounter } from "./server.js";

const h = React.createElement;
let once;

export function TestClient() {
  const [count, setCount] = React.useState(() => "?");

  React.useEffect(() => {
    once ??= (async () => {
      setCount(await getCounter());
    })();
  }, []);

  return h(
    "button",
    {
      "data-testid": "server-in-client",
      onClick: async () => {
        setCount(await changeCounter(1));
      },
    },
    `[server-in-client: ${count}]`,
  );
}
