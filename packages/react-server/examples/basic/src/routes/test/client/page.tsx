import type { PageProps } from "@hiogawa/react-server/server";
import { TestClient } from "./_client";

export default function Page(props: PageProps) {
  return (
    <div>
      <div>Serialized URL</div>
      <TestClient {...props} />
    </div>
  );
}
