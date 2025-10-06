import "./counter.css";
import { useState } from "preact/hooks";

export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div className="card counter-card">
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <br />
      <br />
      <span class="subtitle">This is interactive</span>
    </div>
  );
}
