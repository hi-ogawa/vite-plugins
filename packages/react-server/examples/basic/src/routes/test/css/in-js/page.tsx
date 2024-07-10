"use client";

import { useServerInsertedHTML } from "@hiogawa/react-server/client";

export default function Page() {
  useServerInsertedHTML;

  return <div>CSS in JS</div>;
}
