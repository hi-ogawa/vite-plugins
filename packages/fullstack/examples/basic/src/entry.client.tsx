// @ts-ignore
import "virtual:react-hmr-preamble";
import "./styles/client.css";
import { createRoot } from "react-dom/client";
import { Counter } from "./components/counter";

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

main();
