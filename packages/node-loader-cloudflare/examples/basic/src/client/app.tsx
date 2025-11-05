import { useState } from "hono/jsx";
import { rpc } from "./rpc";

export function App() {
  return (
    <div class="app-container">
      <header class="header">
        <h1>Vite + Cloudflare Workers</h1>
        <p>Full-stack demo with client-side and server-side state</p>
      </header>

      <div class="counters-grid">
        <ClientCounter />
        <ServerCounter />
      </div>
    </div>
  );
}

function ClientCounter() {
  const [count, setCount] = useState(0);
  return (
    <div class="counter-card client">
      <h2>Client Counter</h2>
      <p class="counter-description">
        Runs in your browser. State is reset on page refresh.
      </p>
      <div class="counter-value">{count}</div>
      <div class="button-group">
        <button onClick={() => setCount((c) => c - 1)}>Decrement</button>
        <button data-testid="client" onClick={() => setCount((c) => c + 1)}>
          Increment
        </button>
      </div>
    </div>
  );
}

function ServerCounter() {
  rpc;
  return (
    <div class="counter-card server">
      <h2>Server Counter</h2>
      <p class="counter-description">
        Runs on Cloudflare Workers. Persists in KV storage.
      </p>
      <div class="counter-value">0</div>
      <div class="button-group">
        <button>Decrement</button>
        <button>Increment</button>
      </div>
    </div>
  );
}
