import "./page.css";
import { useState } from "react";

export function Component() {
  const [count, setCount] = useState(0);

  return (
    <main>
      <div className="hero">
        <h1>React Router Custom Framework</h1>
      </div>

      <div className="card counter-card">
        <p>Count: {count}</p>
        <button onClick={() => setCount(count + 1)}>Increment</button>
      </div>
    </main>
  );
}
