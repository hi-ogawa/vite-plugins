import type { LayoutProps } from "@hiogawa/react-server/server";

export default function Page(props: LayoutProps) {
  return (
    <div>
      <input className="antd-input px-2 mb-2" placeholder="dynamic-test" />
      {props.children}
    </div>
  );
}
