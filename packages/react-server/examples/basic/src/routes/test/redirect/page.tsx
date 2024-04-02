import { Link } from "@hiogawa/react-server/client";
import { type PageProps, redirect } from "@hiogawa/react-server/server";
import { sleep } from "@hiogawa/utils";
import { testRedirect } from "./_action";

export default async function Page(props: PageProps) {
  const url = new URL(props.request.url);
  // slow mo to easily see browser url change
  if (url.search) {
    await sleep(500);
  }
  if (url.search.includes("server-component")) {
    throw redirect("/test/redirect?ok");
  }

  return (
    <div className="flex gap-2">
      <Link
        className="antd-btn antd-btn-default px-2"
        href="/test/redirect?server-component"
      >
        From Server Component
      </Link>
      <form action={testRedirect}>
        <button className="antd-btn antd-btn-default px-2">From Action</button>
      </form>
    </div>
  );
}
