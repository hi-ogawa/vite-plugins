import { useState } from "react";
import "./index.css";

export function Component() {
  const [count, setCount] = useState(0);

  return (
    <main>
      <div className="hero">
        <h1>React Router Fullstack</h1>
        <p className="subtitle">A simple demo app with Vite</p>
      </div>

      <div className="card counter-card">
        <h2>Counter Demo</h2>
        <p>Count: {count}</p>
        <button onClick={() => setCount(count + 1)}>Increment</button>
      </div>
    </main>
  );
}
