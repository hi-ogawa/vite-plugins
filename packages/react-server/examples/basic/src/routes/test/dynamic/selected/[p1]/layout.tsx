import type { LayoutProps } from "@hiogawa/react-server/server";
import { SelectedParams } from "../_client";

export default function Page(props: LayoutProps) {
  return (
    <>
      <pre>
        /[p1]/layout.tsx: <SelectedParams />
      </pre>
      {props.children}
    </>
  );
}
