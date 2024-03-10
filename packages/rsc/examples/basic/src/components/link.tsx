"use client";

import { __history } from "../lib/csr";

export function Link(props: JSX.IntrinsicElements["a"]) {
  return (
    <a
      {...props}
      onClick={(e) => {
        e.preventDefault();
        __history.push(props.href!);
      }}
    />
  );
}
