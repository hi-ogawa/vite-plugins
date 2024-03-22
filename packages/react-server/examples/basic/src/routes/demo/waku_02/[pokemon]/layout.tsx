import { Link } from "@hiogawa/react-server/client";
import { type LayoutProps } from "@hiogawa/react-server/server";

export default async function Layout(props: LayoutProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <Link href="/demo/waku_02" className="antd-btn antd-btn-default px-2">
        Home
      </Link>
      {props.children}
    </div>
  );
}
