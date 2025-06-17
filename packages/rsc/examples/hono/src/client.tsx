import * as ReactClient from "@hiogawa/vite-rsc/browser";
import React from "react";
import ReactDOM from "react-dom/client";

function main() {
  const dom = document.getElementById("root")!;
  ReactDOM.createRoot(dom).render(<App />);
}

function App() {
  return (
    <div>
      <h4>hello client</h4>
      <FetchRsc />
    </div>
  );
}

function FetchRsc() {
  const [rsc, setRsc] = React.useState<React.ReactNode>(null);

  return (
    <div>
      <button
        onClick={async () => {
          setRsc(await ReactClient.createFromFetch(fetch("/api/rsc")));
        }}
      >
        fetchRsc
      </button>
      {rsc}
    </div>
  );
}

main();
