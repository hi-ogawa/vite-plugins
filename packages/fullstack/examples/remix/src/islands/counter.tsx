import type { Remix } from "@remix-run/dom";
import { dom } from "@remix-run/events";
import "./counter.css";

export function Counter(this: Remix.Handle, props: { initialCount: number }) {
  let count = props.initialCount;
  return () => {
    return (
      <div className="card counter-card">
        <p>
          Count: <span>{count}</span>
        </p>
        <button
          on={[
            dom.click(() => {
              count++;
              this.update();
            }),
          ]}
        >
          Increment
        </button>
        <br />
        <br />
        <span class="subtitle">This is interactive</span>
      </div>
    );
  };
}
