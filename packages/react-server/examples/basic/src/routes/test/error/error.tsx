"use client";

import { Link } from "@hiogawa/react-server/client";

export default function ErrorPage() {
  return (
    <div className="flex flex-col items-start gap-2">
      <h3>[Error Page]</h3>
      <Link className="antd-btn antd-btn-default px-2" href="/test/error">
        Reset!
      </Link>
    </div>
  );
}
