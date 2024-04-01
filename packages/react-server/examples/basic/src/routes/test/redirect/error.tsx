"use client";

import { useRouter } from "@hiogawa/react-server/client";
import type { ErrorPageProps } from "@hiogawa/react-server/server";
import React from "react";

export default function ErrorPage(props: ErrorPageProps) {
  // TODO: effect is too late.
  //       can we trigger transition during getDerivedStateFromError?
  const history = useRouter((s) => s.history);

  React.useEffect(() => {
    if (props.serverError?.redirectLocation) {
      history.push(props.serverError?.redirectLocation);
    }
  }, [props.serverError?.redirectLocation]);

  return null;
}
