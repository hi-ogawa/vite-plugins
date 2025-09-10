import { useState } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

function main() {
  const domRoot = document.getElementById("client-app")!;
  createRoot(domRoot).render(<App />);
}

function App() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount((c) => c + 1)}>
      Client counter: {count}
    </button>
  );
}

main();
