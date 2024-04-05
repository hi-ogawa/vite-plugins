"use client";

import type { PageProps } from "@hiogawa/react-server/server";

export function TestClient(props: PageProps) {
  return <pre className="text-sm">{JSON.stringify(props.url, null, 2)}</pre>;
}
