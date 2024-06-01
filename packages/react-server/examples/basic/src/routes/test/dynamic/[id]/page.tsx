import type { PageProps } from "@hiogawa/react-server/server";
import { TestDynamic } from "../_utils";

export default function Page(props: PageProps) {
  return (
    <div>
      <input className="antd-input px-2 mb-2" placeholder="dynamic-input" />
      <TestDynamic props={props} file="/test/dynamic/[id]/page.tsx" />
    </div>
  );
}
