import { createError } from "@hiogawa/react-server/server";
import { tinyassert } from "@hiogawa/utils";
import { SearchInput } from "./_client";

export default async function Layout(props: React.PropsWithChildren) {
  return (
    <div className="flex flex-col items-center gap-2">
      <h2 className="text-lg">
        Demo ported from{" "}
        <a
          className="antd-link"
          href="https://github.com/dai-shi/waku/tree/bdcb7b26ef8c69d95eae44cd9f46841fd4a82631/examples/02_demo"
          target="_blank"
        >
          Waku
        </a>
      </h2>
      <SearchInput />
      {/* <form action={search}>
        <input name="q" placeholder="Search..." />
      </form> */}
      {props.children}
    </div>
  );
}

// TODO: better example would be "create" + "redirect"?
export function search(form: FormData) {
  const q = form.get("q");
  tinyassert(typeof q === "string");
  throw createError({
    status: 307,
    headers: {
      location: "/demo/waku_02/" + q,
    },
  });
}
