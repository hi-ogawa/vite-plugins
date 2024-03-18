import { Link } from "@hiogawa/react-server/client";
import type { PageRouteProps } from "@hiogawa/react-server/server";

export default function Page(props: PageRouteProps) {
  const title = new URL(props.request.url).searchParams.get("title");
  return (
    <div className="flex flex-col gap-2">
      {title && <title>{title}</title>}
      {title && <meta name="test" content={title} />}
      <h5 className="text-lg font-bold">head test</h5>
      <div className="flex gap-2">
        <Link className="antd-btn antd-btn-default px-2" href="?title=hello">
          title = hello
        </Link>
        <Link className="antd-btn antd-btn-default px-2" href="?title=world">
          title = world
        </Link>
      </div>
    </div>
  );
}
