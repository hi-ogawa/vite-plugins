import type { LayoutProps } from "@hiogawa/react-server/server";
import { actionTestRevalidate } from "./_action";
import { LinkWithRevalidate } from "./_client";

export default function Layout(_props: LayoutProps) {
  return (
    <div className="flex flex-col gap-3 p-2">
      <h3 className="font-bold">Revalidate Test</h3>
      <form action={actionTestRevalidate} className="flex flex-col gap-2">
        <button className="antd-btn antd-btn-default px-2 self-start">
          Action
        </button>
      </form>
      <div className="flex flex-col gap-2">
        <LinkWithRevalidate
          className="antd-btn antd-btn-default px-2 self-start"
          href="/test/revalidate"
          revalidate
        >
          Navigation
        </LinkWithRevalidate>
      </div>
    </div>
  );
}
