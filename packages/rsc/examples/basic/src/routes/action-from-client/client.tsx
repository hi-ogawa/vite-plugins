"use client";

import { TestAction, TestAction2 } from "./action";

export function TestActionFromClient() {
  return (
    <form action={TestAction}>
      <button>test-action-from-client</button>
      <button formAction={TestAction2}>test-action-from-client-2</button>
    </form>
  );
}
