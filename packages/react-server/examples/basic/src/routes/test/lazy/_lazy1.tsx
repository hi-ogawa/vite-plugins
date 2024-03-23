import { sleep } from "@hiogawa/utils";
import React from "react";

const Lazy2 = React.lazy(async () => {
  await sleep(1000);
  return import("./_lazy2");
});

export default function Lazy1() {
  return (
    <ul className="flex flex-col gap-1">
      <li className="flex items-center">
        <span className="text-lg pr-2">•</span>Lazy1
      </li>
      <li className="flex items-center">
        <span className="text-lg pr-2">•</span>
        <React.Suspense fallback="Loading <Lazy2 />...">
          <Lazy2 />
        </React.Suspense>
      </li>
    </ul>
  );
}
