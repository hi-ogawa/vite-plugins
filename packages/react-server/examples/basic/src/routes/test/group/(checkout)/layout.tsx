import { Link } from "@hiogawa/react-server/client";
import type { LayoutProps } from "@hiogawa/react-server/server";

export default async function Layout(props: LayoutProps) {
  return (
    <div className="flex flex-col gap-2 p-2 border">
      <h1>(checkout)/layout.tsx</h1>
      <Link href="/test/group">Back</Link>
      <div>{props.children}</div>
    </div>
  );
}
