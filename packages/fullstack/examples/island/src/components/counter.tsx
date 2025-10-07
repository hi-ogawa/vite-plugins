import "./client.css";
import { useState } from "preact/hooks";

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button data-testid="client" onClick={() => setCount((c) => c + 1)}>
      Client counter: {count}
    </button>
  );
}
