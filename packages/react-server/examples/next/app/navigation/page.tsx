"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function Page() {
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <>
      <Link id="set-query" href={`${pathname}?a=b&c=d`}>
        set Query
      </Link>
      <div id="query">{params.toString()}</div>
    </>
  );
}
