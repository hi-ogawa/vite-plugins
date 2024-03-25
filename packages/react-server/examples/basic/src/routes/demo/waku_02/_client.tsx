"use client";

import { useRouter } from "@hiogawa/react-server/client";

// TODO: server action + redirect
export function SearchInput() {
  const history = useRouter((s) => s.history);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = e.currentTarget["q"].value;
        if (typeof q === "string") {
          history.push(`/demo/waku_02/${q.toLowerCase()}`);
        }
      }}
    >
      <input name="q" className="antd-input px-2" placeholder="Search..." />
    </form>
  );
}
