"use client";

import { defaultDict, once, tinyassert } from "@hiogawa/utils";
import React from "react";

const countMap = defaultDict(() => 0);

export function MountCount(props: { name: string }) {
  const elRef = React.useRef<HTMLElement>(null);

  React.useEffect(
    once(() => {
      tinyassert(elRef.current);
      elRef.current.textContent = String(++countMap[props.name]);
    }),
    [],
  );

  return (
    <div>
      {props.name} [mount: <span ref={elRef} />]
    </div>
  );
}
