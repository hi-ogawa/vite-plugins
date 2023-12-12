import { h, useState } from "@hiogawa/tiny-react";

console.log("@@ importing app.ts");

export function App(props: { url: string }) {
  const [counter, setCounter] = useState(0);

  return h.div(
    {
      style:
        "display: flex; flex-direction: column; gap: 0.5rem; max-width: 300px",
    },
    h.h4({}, "Vite Node Miniflare Demo"),
    "props",
    h.pre({}, JSON.stringify(props)),
    "input",
    h.input({}),
    "state",
    h.pre({}, `counter = ${counter}`),
    h.div(
      { style: "display: flex; gap: 0.5rem;" },
      h.button({ onclick: () => setCounter(counter - 1) }, "-1"),
      h.button({ onclick: () => setCounter(counter + 1) }, "+1")
    )
  );
}
