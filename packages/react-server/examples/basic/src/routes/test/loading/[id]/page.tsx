import type { PageProps } from "@hiogawa/react-server/server";
import { sleep } from "@hiogawa/utils";
import React from "react";

// TODO: userland `loading` implementation?
export default function PageWithLoading(props: PageProps) {
  return (
    <React.Suspense fallback={<Loading />}>
      <Page {...props} />
    </React.Suspense>
  );
}

function Loading() {
  return <div className="antd-spin size-10" />;
}

async function Page(props: PageProps) {
  await sleep(1000);
  return (
    <div>
      <pre>params {JSON.stringify(props.params)}</pre>
    </div>
  );
}
