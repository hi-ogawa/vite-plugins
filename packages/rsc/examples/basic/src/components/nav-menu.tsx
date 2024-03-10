"use client";

import { __history } from "../lib/csr";

// TODO
// how to setup client-side navigation from server component?

export function NavMenu() {
  return (
    <ul>
      <li>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            __history.push("/");
          }}
        >
          /
        </a>
      </li>
      <li>
        <a
          href="/other"
          onClick={(e) => {
            e.preventDefault();
            __history.push("/other");
          }}
        >
          /other
        </a>
      </li>
    </ul>
  );
}
