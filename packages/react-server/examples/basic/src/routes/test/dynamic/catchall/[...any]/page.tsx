import type { PageProps } from "@hiogawa/react-server/server";
import { TestDynamic } from "../../_utils";

export default function Page(props: PageProps) {
  return (
    <div>
      <TestDynamic
        props={props}
        file="/test/dynamic/catchall/[...any]/page.tsx"
      />
      <label className="flex items-center gap-1">
        test state <input type="checkbox" />
      </label>
    </div>
  );
}
