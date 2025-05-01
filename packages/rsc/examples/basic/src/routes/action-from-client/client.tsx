"use client";

import { testAction, testAction2 } from "./action";

export function TestActionFromClient() {
  return (
    <form action={testAction}>
      <button>test-action-from-client</button>
      <button formAction={testAction2}>test-action-from-client-2</button>
    </form>
  );
}
