import { LinkForm } from "@hiogawa/react-server/client";
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
      <LinkForm action="/test/revalidate" className="flex items-center gap-2">
        <input className="antd-input px-2" name="q" placeholder="Search..." />
        <button className="antd-btn antd-btn-default px-2 self-start">
          Submit
        </button>
      </LinkForm>
    </div>
  );
}
