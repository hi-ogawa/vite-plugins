import { useEffect, useState, useTransition } from "hono/jsx";
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
  const [count, setCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Fetch initial count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await rpc.count.$get();
        const data = await res.json();
        setCount(data.count);
      } catch (error) {
        console.error("Failed to fetch count:", error);
      }
    };
    fetchCount();
  }, []);

  const handleChange = (delta: number) => {
    startTransition(async () => {
      try {
        const res = await rpc.count.$post({ json: { change: delta } });
        const data = await res.json();
        setCount(data.count);
      } catch (error) {
        console.error("Failed to update count:", error);
      }
    });
  };

  return (
    <div class="counter-card server">
      <h2>Server Counter</h2>
      <p class="counter-description">
        Runs on Cloudflare Workers. Persists in KV storage.
      </p>
      <div class="counter-value">{count}</div>
      <div class="button-group">
        <button onClick={() => handleChange(-1)} disabled={isPending}>
          Decrement
        </button>
        <button onClick={() => handleChange(1)} disabled={isPending}>
          Increment
        </button>
      </div>
    </div>
  );
}
