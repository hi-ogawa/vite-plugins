"use client";

import type { ErrorRouteProps } from "@hiogawa/react-server/server";

export default function ErrorPage(props: ErrorRouteProps) {
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
