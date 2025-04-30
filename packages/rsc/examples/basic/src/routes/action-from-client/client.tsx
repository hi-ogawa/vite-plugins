"use client";

import { TestAction } from "./action";

export function TestActionFromClient() {
  return (
    <form action={TestAction}>
      <button>test-action-from-client</button>
    </form>
  );
}
