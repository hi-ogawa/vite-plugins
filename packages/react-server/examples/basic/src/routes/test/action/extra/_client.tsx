"use client";

import React from "react";
import { changeCount3 } from "./_action2";

export function Counter3() {
  const [count, formAction] = React.useActionState(changeCount3, null);
  return (
    <form
      action={formAction}
      data-testid="counter3"
      className="flex items-center gap-2"
    >
      <button
        className="antd-btn antd-btn-default px-2"
        name="value"
        value={-1}
      >
        -1
      </button>
      <button
        className="antd-btn antd-btn-default px-2"
        name="value"
        value={+1}
      >
        +1
      </button>
      <div>Count: {count ?? 0}</div>
    </form>
  );
}
