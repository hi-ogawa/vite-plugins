"use client";

import { Link } from "@hiogawa/react-server/client";

export function LinkInClientComponent() {
  return (
    <div>
      <Link className="antd-link" href="/">
        LinkInClientComponent
      </Link>
    </div>
  );
}
