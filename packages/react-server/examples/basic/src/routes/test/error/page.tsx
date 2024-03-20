import { Link } from "@hiogawa/react-server/client";
import type { PageRouteProps } from "@hiogawa/react-server/server";
import { sleep } from "@hiogawa/utils";

export default async function Page(props: PageRouteProps) {
  await sleep(200);
  const url = new URL(props.request.url);
  if (url.searchParams.has("crash")) {
    // TODO: not caught on SSR. need suspense?
    throw new Error("crash!");
  }
  return (
    <div className="flex flex-col items-start gap-2">
      <h3>[Normal Page]</h3>
      <Link className="antd-btn antd-btn-default px-2" href="/test/error?crash">
        Crash!
      </Link>
    </div>
  );
}
