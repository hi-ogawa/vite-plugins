"use client";

import type { ErrorRouteProps } from "@hiogawa/react-server/server";

export default function ErrorPage(props: ErrorRouteProps) {
  return (
    <div className="flex flex-col gap-2">
      <h4>ErrorPage</h4>
      <div>status: {props.status}</div>
      <div>message: {props.error.message}</div>
    </div>
  );
}
