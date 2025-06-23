import React from "react";

const h = React.createElement;

let counter = 0;

export function ServerCounter() {
  return h(
    "form",
    {
      action: async () => {
        "use server";
        counter++;
      },
    },
    h("button", null, `[server-in-server: ${counter}]`),
  );
}
