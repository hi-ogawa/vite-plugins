import type { ErrorRouteProps } from "@hiogawa/react-server/server";

export default function ErrorPage(props: ErrorRouteProps) {
  console.log("[ErrorPage]", props);
  return (
    <div className="flex flex-col items-start gap-2">
      <h3>[ErrorPage]</h3>
    </div>
  );
}
