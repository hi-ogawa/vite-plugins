import { h, useState } from "@hiogawa/tiny-react";

export function App(props: { url: string }) {
  const [input, setInput] = useState("");
  const [counter, setCounter] = useState(0);

  return h.div(
    {
      style:
        "display: flex; flex-direction: column; gap: 0.5rem; max-width: 300px",
    },
    h.h4({}, "Vite Node Miniflare Demo"),
    "Props",
    h.pre({}, JSON.stringify(props)),
    `Input: ${input}`,
    h.input({
      oninput: (e) => {
        setInput(e.currentTarget.value);
      },
    }),
    `Counter: ${counter}`,
    h.div(
      { style: "display: flex; gap: 0.5rem;" },
      h.button({ onclick: () => setCounter(counter - 1) }, "-1"),
      h.button({ onclick: () => setCounter(counter + 1) }, "+1")
    )
  );
}
