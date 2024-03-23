"use client";

import { sleep } from "@hiogawa/utils";
import React from "react";

const Lazy1 = React.lazy(async () => {
  await sleep(1000);
  return import("./_lazy1");
});

export function ClientComponent() {
  return (
    <div>
      <React.Suspense fallback={"Loading <Lazy1 />..."}>
        <Lazy1 />
      </React.Suspense>
    </div>
  );
}
