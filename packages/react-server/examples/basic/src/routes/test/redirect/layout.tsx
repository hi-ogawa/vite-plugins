import { Link } from "@hiogawa/react-server/client";
import type { LayoutProps } from "@hiogawa/react-server/server";
import { testRedirect } from "./_action";

export default function Layout(props: LayoutProps) {
  return (
    <div className="flex flex-col gap-2 p-2">
      <h3 className="font-bold">Test Redirect</h3>
      <div className="flex gap-2 text-sm">
        <Link
          className="antd-btn antd-btn-default px-2"
          href="/test/redirect?from-server-component"
        >
          Server Component
        </Link>
        <form action={testRedirect}>
          <button className="antd-btn antd-btn-default px-2">Action</button>
        </form>
        <Link
          className="antd-btn antd-btn-default px-2"
          href="/test/redirect?from-suspense"
        >
          Suspense
        </Link>
      </div>
      <div>{props.children}</div>
    </div>
  );
}
