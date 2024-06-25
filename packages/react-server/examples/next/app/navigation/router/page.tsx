"use client";

import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  return (
    <div>
      <button
        id="dynamic-link"
        onClick={() => router.push("/navigation/router/dynamic-gsp/1")}
      >
        Test routing
      </button>
    </div>
  );
}
