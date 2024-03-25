import type { PageProps } from "@hiogawa/react-server/server";
import { sleep } from "@hiogawa/utils";

export default async function Page(props: PageProps) {
  const url = new URL(props.request.url);
  const ms = Number(url.searchParams.get("sleep"));
  await sleep(ms);
  return <p>Took {ms / 1000} sec to load.</p>;
}
