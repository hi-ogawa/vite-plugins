import { Link } from "@hiogawa/react-server/client";
import { type PageProps, cookies } from "@hiogawa/react-server/server";
import { getCounter, incrementCounter, signout } from "./_action";
import { SESSION_KEY } from "./utils";

export default function Page(_props: PageProps) {
  const name = cookies().get(SESSION_KEY)?.value;
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
      {name && (
        <div className="flex items-center gap-3">
          <p>Hello, {name}!</p>
          <form action={signout}>
            <button className="antd-btn antd-btn-default px-2">Signout</button>
          </form>
        </div>
      )}
      {!name && (
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
