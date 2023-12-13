import { useState } from "react";
import { TestComponent } from "./component";

export function App(props: { url: string }) {
  const [input, setInput] = useState("");
  const [counter, setCounter] = useState(0);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxWidth: "300px",
      }}
    >
      <h4>Vite Node Miniflare Demo</h4>
      <div>Props</div>
      <pre>{JSON.stringify(props)}</pre>
      <div>Input {input}</div>
      <input
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
        }}
      />
      <div>Counter: {counter}</div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={() => setCounter(counter - 1)}>-1</button>
        <button onClick={() => setCounter(counter + 1)}>+1</button>
      </div>
      <TestComponent />
    </div>
  );
}
