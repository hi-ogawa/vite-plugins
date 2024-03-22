"use client";

import type { ErrorRouteProps } from "@hiogawa/react-server/server";

export default function ErrorPage(props: ErrorRouteProps) {
  return <div>{props.serverError?.pokemonError || "Unknown error"}</div>;
}
