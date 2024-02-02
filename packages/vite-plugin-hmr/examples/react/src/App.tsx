import { useState } from "react";
import { AppDep1, AppDep2 } from "./AppDep";
import { AppDepDep } from "./AppDepDep";

export function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1>ssr + hmr + react</h1>
      <div>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
      <div>
        <AppDep1 />
        <AppDep2 />
        <AppDepDep />
      </div>
    </>
  );
}
