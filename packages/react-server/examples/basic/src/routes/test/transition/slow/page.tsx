import { sleep } from "@hiogawa/utils";

export default async function Page() {
  await sleep(2000);
  return <div>Took 2 seconds to load</div>;
}
