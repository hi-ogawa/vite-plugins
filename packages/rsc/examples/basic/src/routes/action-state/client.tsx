"use client";

import React from "react";

export function TestActionStateClient({
  action,
}: { action: () => Promise<React.ReactNode> }) {
  const [state, formAction, isPending] = React.useActionState(action, null);

  return (
    <form action={formAction}>
      <button type="submit">
        Log on server{isPending ? " (pending)" : null}
      </button>
      {state}
    </form>
  );
}
