import { type PageProps, redirect } from "@hiogawa/react-server/server";
import { sleep } from "@hiogawa/utils";
import React from "react";

export default async function Page(props: PageProps) {
  const url = new URL(props.request.url);
  if (url.search.includes("from-server-component")) {
    await sleep(500);
    throw redirect("/test/redirect?ok=server-component");
  }
  if (url.search.includes("from-suspense")) {
    return (
      <React.Suspense fallback={"fallback until redirect..."}>
        <Slow />
      </React.Suspense>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div>{url.search.slice(1)}</div>
    </div>
  );
}

const Slow: React.FC = async () => {
  await new Promise((r) => setTimeout(r, 500));
  throw redirect("/test/redirect?ok=suspense");
};
