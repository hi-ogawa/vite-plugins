import type { LayoutProps } from "@hiogawa/react-server/server";

export default function Layout(props: LayoutProps) {
  return (
    <div className="flex flex-col gap-2 p-2">
      <h3 className="font-bold">Route groups</h3>
      {props.children}
    </div>
  );
}
