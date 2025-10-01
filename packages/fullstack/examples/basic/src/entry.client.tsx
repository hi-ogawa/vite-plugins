import "./styles/client.css";
import { useState } from "react";
import { createRoot } from "react-dom/client";

function main() {
  const domRoot = document.getElementById("client-app")!;
  createRoot(domRoot).render(<App />);

  if (import.meta.hot) {
    // TODO
    import.meta.hot.on("fullstack:update", (e) => {
      console.log("[fullstack:update]", e);
      window.location.reload();
    });
  }
}

function App() {
  return (
    <div>
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

main();
