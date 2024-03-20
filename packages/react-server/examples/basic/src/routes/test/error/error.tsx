import type { ErrorRouteProps } from "@hiogawa/react-server/server";

export default function ErrorPage(props: ErrorRouteProps) {
  console.log("[ErrorPage]", props);
  return <div>ErrorPage</div>;
}
