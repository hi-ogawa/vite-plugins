import type { PageProps } from "@hiogawa/react-server/server";

export default function Page(props: PageProps) {
  return <pre className="text-sm">{JSON.stringify(props.params)}</pre>;
}
