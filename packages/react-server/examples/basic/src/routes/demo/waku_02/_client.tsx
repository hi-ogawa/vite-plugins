"use client";

import { useRouter } from "@hiogawa/react-server/client";

// TODO: server action + redirect
export function SearchInput() {
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = e.currentTarget["q"].value;
        if (typeof q === "string") {
          router.history.push(`/demo/waku_02/${q.toLowerCase()}`);
        }
      }}
    >
      <input name="q" className="antd-input px-2" placeholder="Search..." />
    </form>
  );
}
