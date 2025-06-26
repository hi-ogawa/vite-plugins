"use client";

import React from "react";

export function TestActionStateClient({
  fn,
}: { fn: () => Promise<React.ReactNode> }) {
  const [state, formAction, isPending] = React.useActionState(fn, null);

  return (
    <form action={formAction}>
      <button type="submit">
        Log on server{isPending ? " (pending)" : null}
      </button>
      {state}
    </form>
  );
}
