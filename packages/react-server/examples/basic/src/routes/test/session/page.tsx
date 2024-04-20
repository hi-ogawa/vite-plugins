import { Link } from "@hiogawa/react-server/client";
import type { PageProps } from "@hiogawa/react-server/server";
import { getCounter, incrementCounter, signout } from "./_action";
import { getSession } from "./utils";

export default function Page(props: PageProps) {
  const session = getSession(new Headers(props.request.headers));
  return (
    <div className="flex flex-col gap-4 p-3 max-w-sm">
      <form className="flex items-center gap-2" action={incrementCounter}>
        <p>Counter: {getCounter()}</p>
        <button
          className="antd-btn antd-btn-default px-2"
          name="delta"
          value={-1}
        >
          -1
        </button>
        <button
          className="antd-btn antd-btn-default px-2"
          name="delta"
          value={+1}
        >
          +1
        </button>
        <span className="text-colorTextLabel text-sm">(signin required)</span>
      </form>
      {session?.name && (
        <div className="flex items-center gap-3">
          <p>Hello, {session.name}!</p>
          <form action={signout}>
            <button className="antd-btn antd-btn-default px-2">Signout</button>
          </form>
        </div>
      )}
      {!session?.name && (
        <div className="flex items-center gap-3 ">
          <p>Hi, anonymous user!</p>
          <Link
            className="antd-btn antd-btn-default px-2"
            href="/test/session/signin"
          >
            Signin
          </Link>
        </div>
      )}
    </div>
  );
}
