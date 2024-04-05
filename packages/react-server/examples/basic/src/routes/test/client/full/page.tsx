"use client";

import type { PageProps } from "@hiogawa/react-server/server";

export default function Page(props: PageProps) {
  return (
    <div className="flex flex-col gap-2 border p-2">
      <h5 className="font-bold">"use client" page</h5>
      <details>
        <summary>PageProps</summary>
        <pre className="text-xs">{JSON.stringify(props, null, 2)}</pre>
      </details>
    </div>
  );
}
