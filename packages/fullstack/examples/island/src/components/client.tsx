import "./client.css";
import { useState } from "preact/hooks";

export default function Client() {
  return (
    <div style={{ border: "2px solid orange", padding: "1rem" }}>
      <h4>Island</h4>
      <Counter />
      <div className="test-client-style">test-client-style</div>
    </div>
  );
}

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button data-testid="client" onClick={() => setCount((c) => c + 1)}>
      Client counter: {count}
    </button>
  );
}
