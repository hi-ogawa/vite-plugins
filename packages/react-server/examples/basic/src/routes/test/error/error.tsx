"use client";

import { Link, __history } from "@hiogawa/react-server/client";
import type { ErrorRouteProps } from "@hiogawa/react-server/server";
import React from "react";

export default function ErrorPage(props: ErrorRouteProps) {
  React.useEffect(() => {
    // reset on route change.
    // TODO: subscribe to browser entry re-render?
    return __history.subscribe(() => {
      React.startTransition(() => {
        props.reset();
      });
    });
  }, []);

  return (
    <div className="flex flex-col items-start gap-2">
      <h3>[Error Page]</h3>
      <Link className="antd-btn antd-btn-default px-2" href="/test/error">
        Reset!
      </Link>
    </div>
  );
}
