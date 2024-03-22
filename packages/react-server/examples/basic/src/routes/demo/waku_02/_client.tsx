"use client";

import { __global } from "@hiogawa/react-server";

// TODO: server action + redirect
export function SearchInput() {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = e.currentTarget["q"].value;
        if (q) {
          __global.history.push(`/demo/waku_02/${q}`);
        }
      }}
    >
      <input name="q" className="antd-input px-2" placeholder="Search..." />
    </form>
  );
}
