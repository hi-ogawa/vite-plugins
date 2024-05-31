import type { PageProps } from "@hiogawa/react-server/server";
import { sleep } from "@hiogawa/utils";
import React from "react";

// TODO: userland implementation?
export default function PageWrapper(props: PageProps) {
  return (
    <React.Suspense fallback={"loading...."} key={props.params.id}>
      <Page {...props} />
    </React.Suspense>
  );
}

async function Page(props: PageProps) {
  await sleep(1000);
  return (
    <div>
      <pre>{JSON.stringify(props.params, null, 2)}</pre>
    </div>
  );
}
