import type { LayoutRouteProps } from "@hiogawa/react-server/server";

export default function Layout(props: LayoutRouteProps) {
  return (
    <div className="flex flex-col items-start gap-2">
      <h3>[Layout]</h3>
      <div>{props.children}</div>
    </div>
  );
}
