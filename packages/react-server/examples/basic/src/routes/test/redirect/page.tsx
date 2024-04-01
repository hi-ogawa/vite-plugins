import { Link } from "@hiogawa/react-server/client";
import { type PageProps, redirect } from "@hiogawa/react-server/server";

export default function Page(props: PageProps) {
  const url = new URL(props.request.url);
  if (url.search.includes("from")) {
    throw redirect("/test/redirect?to");
  }

  return (
    <div className="flex gap-2">
      <Link
        className="antd-btn antd-btn-default px-2"
        href="/test/redirect?from"
      >
        From
      </Link>
      <Link className="antd-btn antd-btn-default px-2" href="/test/redirect?to">
        To
      </Link>
    </div>
  );
}
