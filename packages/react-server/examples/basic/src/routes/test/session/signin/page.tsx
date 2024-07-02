import {
  type PageProps,
  cookies,
  redirect,
} from "@hiogawa/react-server/server";
import { signin } from "../_action";
import { SESSION_KEY } from "../utils";

export default function Page(_props: PageProps) {
  const name = cookies().get(SESSION_KEY)?.value;
  if (name) {
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
