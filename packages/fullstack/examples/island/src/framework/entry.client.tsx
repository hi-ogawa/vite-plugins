import { render } from "preact";
import { Counter } from "../components/counter";

function main() {
  const domRoot = document.getElementById("client-app")!;
  render(<App />, domRoot);
}

function App() {
  return (
    <div style={{ border: "2px solid orange", padding: "1rem" }}>
      <h4>Client-only island</h4>
      <Counter />
      <div className="test-client-style">test-client-style</div>
    </div>
  );
}

main();
