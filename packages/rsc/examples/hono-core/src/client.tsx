import React from "react";
import ReactDOM from "react-dom/client";
// @ts-ignore
import ReactClient from "react-server-dom-webpack/client.browser";

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
          const rsc = await ReactClient.createFromFetch(fetch("/api/rsc"));
          setRsc(rsc);
        }}
      >
        fetchRsc
      </button>
      {rsc}
    </div>
  );
}

main();
