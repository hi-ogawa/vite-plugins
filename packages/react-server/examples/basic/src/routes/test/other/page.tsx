import { Link } from "@hiogawa/react-server/client";
import type { PageProps } from "@hiogawa/react-server/server";
import { LinkInClientComponent, LinkOnClickMerge } from "./_client";

export default function Page(props: PageProps) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-bold">Other Page</h4>
      <div>
        <LinkInClientComponent />
      </div>
      <div>
        <LinkOnClickMerge />
      </div>
      <h5 className="font-bold">props.request</h5>
      <div className="flex flex-col gap-2">
        <pre className="text-sm">
          searchParams = {JSON.stringify(props.searchParams)}
        </pre>
        <div className="flex gap-2">
          <Link
            className="antd-btn antd-btn-default px-2"
            href="/test/other?hello"
          >
            hello
          </Link>
          <Link
            className="antd-btn antd-btn-default px-2"
            href="/test/other?world"
          >
            world
          </Link>
        </div>
      </div>
      <h5 className="font-bold">custom entry</h5>
      <div>
        <a className="antd-link" href="/test/__rpc">
          /test/__rpc
        </a>
      </div>
    </div>
  );
}
