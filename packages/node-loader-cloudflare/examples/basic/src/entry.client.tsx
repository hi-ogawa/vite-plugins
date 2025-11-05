import { useState } from "hono/jsx";
import { render } from "hono/jsx/dom";

function main() {
  const domRoot = document.getElementById("client-app")!;
  render(<App />, domRoot);
}

function App() {
  const [count, setCount] = useState(0);
  return (
    <button data-testid="client" onClick={() => setCount((c) => c + 1)}>
      Client counter: {count}
    </button>
  );
}

main();
