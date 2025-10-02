import "./index.css";
import { useState } from "react";

export function Component() {
  return (
    <main>
      <h1>React Router</h1>
      <Card />
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </main>
  );
}

function Card() {
  const [count, setCount] = useState(0);

  return (
    <div className="card">
      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
      <p>
        Edit <code>src/routes/index.tsx</code> and save to test HMR
      </p>
    </div>
  );
}
