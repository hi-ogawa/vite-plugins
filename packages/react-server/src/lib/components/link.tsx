"use client";

import { __history } from "../csr";

export function Link(props: JSX.IntrinsicElements["a"] & { href: string }) {
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
