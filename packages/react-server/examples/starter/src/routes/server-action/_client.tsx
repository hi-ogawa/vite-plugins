"use client";

import { changeCounter } from "./_action";

export function Counter({ value }: { value: number }) {
  return (
    <form action={changeCounter}>
      <div>Count: {value}</div>
      <div>
        <button name="delta" value={-1}>
          -1
        </button>
        <button name="delta" value={+1}>
          +1
        </button>
      </div>
    </form>
  );
}
