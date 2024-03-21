import { Link } from "@hiogawa/react-server/client";

export default async function Page() {
  return (
    <div className="flex gap-2 p-2">
      <Link
        className="antd-btn antd-btn-default px-2"
        href="/test/error/server"
      >
        Server
      </Link>
      <Link
        className="antd-btn antd-btn-default px-2"
        href="/test/error/browser"
      >
        Browser
      </Link>
    </div>
  );
}
