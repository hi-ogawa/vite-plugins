import { useState } from "@hiogawa/tiny-react";
import { TestComponent } from "./component";

export function App(props: { url: string }) {
  const [input, setInput] = useState("");
  const [counter, setCounter] = useState(0);

  if (typeof window === "undefined" && props.url.includes("crash-ssr")) {
    throw new Error("crash ssr");
  }

  return (
    <div style="display: flex; flex-direction: column; gap: 0.5rem; max-width: 300px">
      <h4>Vite Node Miniflare Demo</h4>
      <div>Props</div>
      <pre>{JSON.stringify(props)}</pre>
      <div>{`Input: ${input}`}</div>
      <input
        value={input}
        oninput={(e) => {
          setInput(e.currentTarget.value);
        }}
      />
      <div>{`Counter: ${counter}`}</div>
      <div style="display: flex; gap: 0.5rem;">
        <button onclick={() => setCounter(counter - 1)}>-1</button>
        <button onclick={() => setCounter(counter + 1)}>+1</button>
      </div>
      <TestComponent />
    </div>
  );
}
