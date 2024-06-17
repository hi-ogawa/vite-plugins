import type { LayoutProps } from "@hiogawa/react-server/server";

export default async function Layout(props: LayoutProps) {
  return (
    <div className="p-2">
      <h3 className="font-bold mb-2">React.cache example</h3>
      {props.children}
    </div>
  );
}
