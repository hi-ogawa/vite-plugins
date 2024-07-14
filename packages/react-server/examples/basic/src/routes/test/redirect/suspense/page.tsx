import { redirect } from "@hiogawa/react-server/server";
import React from "react";

export default function Page() {
  return (
    <React.Suspense fallback={""}>
      <Slow />
    </React.Suspense>
  );
}

async function Slow() {
  await new Promise((r) => setTimeout(r, 1000));
  if (1) throw redirect("/test/redirect?ok-suspense");
  return null;
}
