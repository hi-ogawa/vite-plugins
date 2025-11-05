import { useState } from "hono/jsx";
import { rpc } from "./rpc";

export function App() {
  return (
    <div>
      <ClientCounter />
      <ServerCounter />
    </div>
  );
}

function ClientCounter() {
  const [count, setCount] = useState(0);
  return (
    <button data-testid="client" onClick={() => setCount((c) => c + 1)}>
      Client counter: {count}
    </button>
  );
}

function ServerCounter() {
  rpc;
  return <button>Server counter: 0</button>;
}
