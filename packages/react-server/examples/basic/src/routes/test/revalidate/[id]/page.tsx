import type { PageProps } from "@hiogawa/react-server/server";

export default function Page(props: PageProps) {
  return (
    <div>
      <pre>params = {JSON.stringify(props.params)}</pre>
    </div>
  );
}
