import { Link } from "@hiogawa/react-server/client";
import type { PageRouteProps } from "@hiogawa/react-server/server";
import { LinkInClientComponent } from "./client";

export default function Page(props: PageRouteProps) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-bold">Other Page</h4>
      <div>
        <LinkInClientComponent />
      </div>
      <h5 className="font-bold">props.request</h5>
      <div className="flex flex-col gap-2">
        <pre className="text-sm">
          searchParams ={" "}
          {JSON.stringify(
            Object.fromEntries(
              new URL(props.request.url).searchParams.entries()
            )
          )}
        </pre>
        <div className="flex gap-2">
          <Link className="antd-btn antd-btn-default px-2" href="?hello">
            hello
          </Link>
          <Link className="antd-btn antd-btn-default px-2" href="?world">
            world
          </Link>
        </div>
      </div>
    </div>
  );
}
