import type { Remix } from "@remix-run/dom";
import { dom } from "@remix-run/events";

export function Root() {
  return (
    <div>
      <input style={{ marginBottom: "0.5rem" }} placeholder="test-input" />
      <Counter />
    </div>
  );
}

function Counter(this: Remix.Handle) {
  let count = 0;
  const setCount = (v: number) => {
    count = v;
    this.update();
  };

  return () => {
    return (
      <div>
        <div style={{ marginRight: "0.5rem" }}>Count: {count}</div>
        <button
          on={dom.click(() => {
            setCount(count - 1);
          })}
        >
          -1
        </button>
        <button
          on={dom.click(() => {
            setCount(count + 1);
          })}
        >
          +1
        </button>
      </div>
    );
  };
}
