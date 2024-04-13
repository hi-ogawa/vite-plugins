"use client";

import type { ErrorPageProps } from "@hiogawa/react-server/server";
import React from "react";

export default function ErrorPage(props: ErrorPageProps) {
  React.useEffect(() => {
    (async () => { throw props.error; })();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <h4>ErrorPage</h4>
      <div>
        server error:{" "}
        {props.serverError ? JSON.stringify(props.serverError) : "(N/A)"}
      </div>
    </div>
  );
}
