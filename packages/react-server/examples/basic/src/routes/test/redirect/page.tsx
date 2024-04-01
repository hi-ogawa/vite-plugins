import { Link } from "@hiogawa/react-server/client";

export default function Page() {
  return (
    <div className="flex gap-2">
      <Link
        className="antd-btn antd-btn-default px-2"
        href="/test/redirect/from"
      >
        From
      </Link>
      <Link className="antd-btn antd-btn-default px-2" href="/test/redirect/to">
        To
      </Link>
    </div>
  );
}
