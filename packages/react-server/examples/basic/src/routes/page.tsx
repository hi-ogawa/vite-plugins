import type { PageProps } from "@hiogawa/react-server/server";

export default function Page(props: PageProps) {
  if ("test-error" in props.searchParams) {
    throw new Error("boom!");
  }
  return <div>Choose a page from the menu</div>;
}
