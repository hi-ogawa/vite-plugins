import type { PageProps } from "@hiogawa/react-server/server";
import { signin, signout } from "./_action";
import { getSession } from "./utils";

export default function Page(props: PageProps) {
  const session = getSession(props.request);
  if (session?.user) {
    return (
      <form className="flex flex-col gap-2 p-2 max-w-sm" action={signout}>
        Hello {session?.user?.name || "TODO"}!
        <button className="antd-btn antd-btn-default">Signout</button>
      </form>
    );
  }

  return (
    <form className="flex flex-col gap-2 p-2 max-w-sm" action={signin}>
      <input
        className="antd-input px-2"
        name="name"
        placeholder="Input name..."
        required
      />
      <button className="antd-btn antd-btn-primary">Signin</button>
    </form>
  );
}
