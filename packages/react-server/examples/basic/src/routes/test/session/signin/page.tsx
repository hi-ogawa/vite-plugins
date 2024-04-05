import { type PageProps, redirect } from "@hiogawa/react-server/server";
import { signin } from "../_action";
import { getSession } from "../utils";

export default function Page(props: PageProps) {
  const session = getSession(new Headers(props.request.headers));
  if (session?.name) {
    throw redirect("/test/session");
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
