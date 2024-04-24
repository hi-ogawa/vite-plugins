import type { PageProps } from "@hiogawa/react-server/server";
import { TestDynamic } from "../../_utils";

export default function Page(props: PageProps) {
  return (
    <TestDynamic props={props} file="/test/dynamic/catchall/static/page.tsx" />
  );
}
