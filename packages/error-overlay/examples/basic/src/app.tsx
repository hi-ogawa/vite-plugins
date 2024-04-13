import React from "react";

export function App() {
  const [input, setInput] = React.useState("");
  const [counter, setCounter] = React.useState(0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxWidth: "300px",
      }}
    >
      <h2>Example</h2>
      <div>{import.meta.env.SSR ? "Hey server!" : "Yo client!"}</div>
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
        <button
          onClick={() => {
            throw new Error("boom!");
          }}
        >
          boom!
        </button>
      </div>
    </div>
  );
}
