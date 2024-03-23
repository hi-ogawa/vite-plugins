"use client";

import type { ErrorPageProps } from "@hiogawa/react-server/server";

export default function ErrorPage(props: ErrorPageProps) {
  return <div>{props.serverError?.pokemonError || "Unknown error"}</div>;
}
