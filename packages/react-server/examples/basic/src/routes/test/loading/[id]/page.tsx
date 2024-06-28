import type { PageProps } from "@hiogawa/react-server/server";
import { sleep } from "@hiogawa/utils";

export default async function Page(props: PageProps) {
  await sleep(1000);
  return (
    <div>
      <pre>params {JSON.stringify(props.params)}</pre>
    </div>
  );
}
