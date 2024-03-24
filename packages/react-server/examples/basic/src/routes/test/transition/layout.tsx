import type { LayoutProps } from "@hiogawa/react-server/server";
import { getCounter } from "./_action";
import { Counter, Tablist } from "./_client";

// similar demo
// https://react.dev/reference/react/useTransition#marking-a-state-update-as-a-non-blocking-transition

export default async function Layout(props: LayoutProps) {
  return (
    <div className="w-lg flex flex-col gap-4 p-4">
      <div className="border p-3 flex flex-col gap-2">
        <h4 className="font-bold">Navigation State</h4>
        <Tablist />
        <div className="p-2">{props.children}</div>
      </div>
      <div className="border p-3 flex flex-col gap-2">
        <h4 className="font-bold">Action state</h4>
        <Counter value={getCounter()} />
      </div>
    </div>
  );
}
