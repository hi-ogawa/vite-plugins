import type { PageProps } from "@hiogawa/react-server/server";
import { Postpone } from "./_client";

export default async function Page(props: PageProps) {
  if (props.url.search.includes("sleep")) {
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (props.url.search.includes("postpone")) {
    return <Postpone />;
  }
  return <div>Page</div>;
}
